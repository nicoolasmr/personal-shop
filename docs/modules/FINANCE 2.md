# Finance Module

## Visão Geral

O módulo Finance permite controle de receitas e despesas com:
- CRUD de transações (income/expense)
- Categorias personalizadas
- Resumo mensal com totais
- Navegação por mês
- Sincronização com metas financeiras

## Tabelas

### transactions
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| org_id | uuid | FK → orgs |
| user_id | uuid | FK → auth.users |
| category_id | uuid | FK → transaction_categories |
| type | text | 'income' ou 'expense' |
| amount | numeric(12,2) | Valor (> 0) |
| description | text | Descrição |
| transaction_date | date | Data da transação |
| is_recurring | boolean | Se é recorrente |

### transaction_categories
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| org_id | uuid | FK → orgs |
| user_id | uuid | FK → auth.users |
| name | text | Nome da categoria |
| type | text | 'income' ou 'expense' |
| icon | text | Ícone Lucide |
| color | text | Cor (tailwind) |
| is_default | boolean | Se é categoria padrão |

## RLS Policies

Todas as tabelas usam multi-tenant com `org_id` do profile do usuário via `get_user_org_id()`.

## Sincronização Finance → Goals

### Arquitetura (Hotfix 3.3.2)

A sincronização agora opera em **duas camadas** para garantir idempotência:

1. **Database Trigger** (`sync_financial_goals`):
   - Dispara automaticamente em INSERT/UPDATE/DELETE de transactions
   - Chama RPC `sync_financial_goal` para cada meta financeira ativa
   - Usa `integration_key` para deduplificação

2. **Frontend Hook** (`useFinanceGoalsSync`):
   - Fallback para sync manual
   - Dispara ao navegar para Finance
   - Não duplica graças ao constraint

### Source of Truth

| Entidade | Fonte | Atualização |
|----------|-------|-------------|
| Transações | `transactions` table | CRUD direto |
| Summary mensal | RPC `get_monthly_summary` | Calculado on-demand |
| Meta current_value | `goals.current_value` | Trigger + RPC |
| Histórico | `goal_progress` | Upsert com `integration_key` |

### Idempotência

```sql
-- Unique constraint garante sem duplicatas
CREATE UNIQUE INDEX goal_progress_finance_sync_unique
  ON goal_progress (goal_id, source, integration_key)
  WHERE source = 'finance_sync' AND integration_key IS NOT NULL;

-- RPC faz upsert atomicamente
SELECT sync_financial_goal(org_id, user_id, goal_id, 5000.00, '2025-12');
```

### Fluxo de Dados

```
Transaction INSERT/UPDATE/DELETE
        ↓
  [Trigger: sync_financial_goals]
        ↓
  calculate_finance_totals()
        ↓
  sync_financial_goal() RPC
        ↓
  UPSERT goal_progress (integration_key = 'finance_YYYY-MM')
        ↓
  UPDATE goals.current_value
```

## Migrations

1. `MIGRATION_0009_finance.sql` - Tabelas, RLS e funções RPC
2. `MIGRATION_0009_1_habit_goal_sync.sql` - Sincronização hábitos→metas (via trigger)
3. `MIGRATION_0011_finance_goals_trigger.sql` - Trigger Finance → Goals
4. `MIGRATION_0013_finance_sync_idempotent.sql` - Constraint + RPC idempotente

## Funções RPC

- `get_monthly_summary(org_id, user_id, year, month)` - Totais do mês
- `get_category_breakdown(org_id, user_id, type, year, month)` - Por categoria
- `get_user_org_id()` - Retorna org_id do usuário (security definer)
