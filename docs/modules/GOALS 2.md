# Goals Module Documentation

> Sprint 3.0 - Sistema de Metas do VIDA360

## Visão Geral

O módulo de Metas permite aos usuários definir, acompanhar e alcançar objetivos mensuráveis. Suporta diferentes tipos de metas com configurações pré-definidas e integração com outros módulos.

## Tipos de Meta

| Tipo | Label | Unidade Padrão | Frequência | Descrição |
|------|-------|----------------|------------|-----------|
| `custom` | Personalizada | - | Diário | Meta genérica definida pelo usuário |
| `financial` | Financeira | R$ | Mensal | Economia e investimentos |
| `savings` | Economia | R$ | Mensal | Meta de economia específica |
| `habit` | Hábito | dias | Diário | Vinculada a hábitos existentes |
| `task` | Tarefa | tarefas | Semanal | Vinculada a tarefas |
| `reading` | Leitura | páginas | Diário | Tracking de leitura |
| `weight` | Peso | kg | Semanal | Controle de peso |
| `exercise` | Exercício | minutos | Diário | Atividade física |
| `study` | Estudo | horas | Diário | Tempo de estudo |
| `health` | Saúde | dias | Diário | Metas de saúde geral |

## Modelo de Dados

### Tabela: `goals`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID único da meta |
| `org_id` | UUID (FK orgs) | Organização |
| `user_id` | UUID (FK auth.users) | Dono da meta |
| `type` | TEXT | Tipo da meta (ver lista acima) |
| `title` | TEXT | Título da meta |
| `description` | TEXT | Descrição opcional |
| `target_value` | NUMERIC | Valor alvo (ex: 5000) |
| `current_value` | NUMERIC | **Valor atual (calculado por trigger)** |
| `unit` | TEXT | Unidade de medida (R$, kg, páginas) |
| `due_date` | DATE | Data limite opcional |
| `status` | TEXT | `active`, `done`, `archived` |
| `linked_habit_id` | UUID (FK habits) | Vínculo com hábito (opcional) |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Última atualização |

**Importante:** `current_value` é um campo **derivado** - nunca atualizado diretamente pela aplicação. É recalculado automaticamente pelo trigger quando registros de progresso são alterados.

### Tabela: `goal_progress`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID do registro |
| `org_id` | UUID (FK orgs) | Organização |
| `goal_id` | UUID (FK goals) | Meta relacionada |
| `user_id` | UUID (FK auth.users) | Quem registrou |
| `progress_date` | DATE | Data do progresso |
| `delta_value` | NUMERIC | Valor incremental (+/-) |
| `notes` | TEXT | Anotações opcionais |
| `source` | TEXT | `app`, `whatsapp`, `integration` |
| `created_at` | TIMESTAMPTZ | Data de criação |

### Trigger: `on_goal_progress_change`

O trigger `update_goal_current_value()` é executado após INSERT, UPDATE ou DELETE em `goal_progress`:

1. Recalcula a soma de todos `delta_value` para o `goal_id` afetado
2. Atualiza `current_value` na tabela `goals`
3. Em caso de UPDATE que muda `goal_id`, atualiza ambos (antigo e novo)

**Características:**
- `SECURITY DEFINER`: Bypassa RLS para atualizar goals
- Trata NULLs com `COALESCE(..., 0)`
- Atualiza `updated_at` automaticamente

## RLS Policies

### goals

| Operação | Regra |
|----------|-------|
| SELECT | Membro da org (`is_org_member`) |
| INSERT | Membro da org E `user_id = auth.uid()` |
| UPDATE | Membro da org E dono da meta |
| DELETE | Membro da org E dono da meta |

### goal_progress

| Operação | Regra |
|----------|-------|
| SELECT | Membro da org |
| INSERT | Membro da org E dono do progresso E meta pertence ao usuário |
| UPDATE | Membro da org E dono do progresso E meta pertence ao usuário |
| DELETE | Membro da org E dono do progresso E meta pertence ao usuário |

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
├─────────────────────────────────────────────────────────────┤
│  GoalCard → ProgressModal → addProgress()                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Client                           │
├─────────────────────────────────────────────────────────────┤
│  INSERT INTO goal_progress (delta_value, goal_id, ...)      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Trigger                         │
├─────────────────────────────────────────────────────────────┤
│  on_goal_progress_change → update_goal_current_value()      │
│  1. SUM(delta_value) WHERE goal_id = NEW.goal_id            │
│  2. UPDATE goals SET current_value = sum                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Query Cache                         │
├─────────────────────────────────────────────────────────────┤
│  invalidateQueries(['goals']) → Refetch → UI atualiza       │
└─────────────────────────────────────────────────────────────┘
```

## Integração com Hábitos

Metas do tipo `habit` podem ser vinculadas a hábitos existentes via `linked_habit_id`:

1. Usuário cria meta tipo "Hábito" e seleciona hábito existente
2. Sistema pode sincronizar check-ins do hábito → progresso da meta
3. Hook `useSyncHabitToGoal()` disponível para sincronização manual

## API de Serviço

### `listGoals(orgId, status?)`
Lista metas da organização, opcionalmente filtradas por status.

### `getGoal(orgId, goalId)`
Busca uma meta específica com seu histórico de progresso.

### `createGoal(orgId, userId, payload)`
Cria nova meta.

### `updateGoal(orgId, userId, goalId, payload)`
Atualiza meta existente.

### `archiveGoal(orgId, userId, goalId)`
Arquiva meta (soft delete).

### `completeGoal(orgId, userId, goalId)`
Marca meta como concluída.

### `addProgress(orgId, userId, goalId, payload)`
Registra progresso incremental.

### `deleteProgress(orgId, userId, progressId)`
Remove registro de progresso.

### `getActiveGoalsSummary(orgId)`
Resumo para card da Home: total ativas, atrasadas, etc.

## Migrations

| Arquivo | Descrição |
|---------|-----------|
| `MIGRATION_0008_goals.sql` | Tabelas, RLS, trigger básico |
| `MIGRATION_0008_1_schema_migrations.sql` | Tracking de migrations |
| `MIGRATION_0008_2_goals_integrity.sql` | Constraints, índices, trigger robusta |

## Verificações de Integridade

```sql
-- Verificar current_value está sincronizado
SELECT g.id, g.title, g.current_value, 
       COALESCE(SUM(gp.delta_value), 0) as calculated
FROM goals g
LEFT JOIN goal_progress gp ON gp.goal_id = g.id
GROUP BY g.id
HAVING g.current_value != COALESCE(SUM(gp.delta_value), 0);

-- Forçar recálculo de uma meta específica
UPDATE goal_progress SET delta_value = delta_value 
WHERE goal_id = 'goal-uuid' LIMIT 1;
-- (trigger recalcula automaticamente)
```

## Troubleshooting

### Problema: current_value não atualiza
**Causa:** Trigger não está ativo ou não foi criado.
**Solução:**
```sql
-- Verificar trigger existe
SELECT tgname FROM pg_trigger WHERE tgname = 'on_goal_progress_change';

-- Se não existir, reaplicar MIGRATION_0008_2
```

### Problema: "could not find table goals in schema cache"
**Solução:**
```sql
NOTIFY pgrst, 'reload schema';
```

### Problema: RLS bloqueia insert em goal_progress
**Causa:** Usuário não é dono da meta.
**Verificação:**
```sql
SELECT user_id FROM goals WHERE id = 'goal-id';
-- Comparar com auth.uid() do usuário logado
```
