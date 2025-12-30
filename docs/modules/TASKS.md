# VIDA360 - Tasks Module (Kanban)

Este documento descreve a arquitetura técnica do módulo de Tarefas (Kanban) do VIDA360.

## Índice

1. [Visão Geral](#visão-geral)
2. [Estratégia de Gap Ordering](#estratégia-de-gap-ordering)
3. [Políticas RLS](#políticas-rls)
4. [Componentes e Serviços](#componentes-e-serviços)
5. [Audit Log](#audit-log)

---

## Visão Geral

O módulo de Tasks implementa um quadro Kanban com três colunas:
- **A Fazer** (`todo`)
- **Fazendo** (`doing`)
- **Feito** (`done`)

### Funcionalidades

- Drag & drop entre colunas
- Subtarefas com checkbox
- Prioridade (baixa/média/alta)
- Data de vencimento
- Tags personalizadas
- Arquivamento (soft delete)

---

## Estratégia de Gap Ordering

### Problema Original

O cálculo original de `sort_order` usava incrementos de 1:
```typescript
// ANTES (problemático)
const sortOrder = (maxOrder?.sort_order ?? -1) + 1;
```

Isso causava:
- Colisões quando múltiplas operações ocorriam simultaneamente
- Degradação após muitos movimentos (valores ficavam "espremidos")
- Necessidade de reordenar toda a coluna frequentemente

### Solução: Gap Ordering

Implementamos **Gap Ordering** com as seguintes constantes:

```typescript
const GAP_SIZE = 1000;  // Espaçamento entre tasks
const MIN_GAP = 2;      // Gap mínimo antes de trigger reindex
```

### Algoritmo de Movimentação

Quando uma task é movida:

1. **Coluna vazia**: `sort_order = GAP_SIZE` (1000)
2. **Primeira posição**: `sort_order = primeiro.sort_order - GAP_SIZE`
3. **Última posição**: `sort_order = último.sort_order + GAP_SIZE`
4. **Posição intermediária**: `sort_order = floor((anterior + próximo) / 2)`

### Reindex Automático

Quando o gap entre duas tasks adjacentes é menor que `MIN_GAP` (2), o sistema automaticamente executa `reindexColumn()`:

```typescript
async function reindexColumn(orgId: string, status: TaskStatus): Promise<void> {
  // Busca todas as tasks da coluna ordenadas
  // Reatribui sort_order: 1000, 2000, 3000, ...
}
```

### Quando o Reindex Acontece

- **Automaticamente**: Durante `moveTask()` se gap < 2
- **Manualmente**: Via função SQL `reindex_all_task_columns(org_id)`

### Exemplo Visual

```
ANTES (problemático):        DEPOIS (gap ordering):
Task A: sort_order = 0       Task A: sort_order = 1000
Task B: sort_order = 1       Task B: sort_order = 2000
Task C: sort_order = 2       Task C: sort_order = 3000

Inserir entre A e B:         Inserir entre A e B:
- Difícil, precisa           - Fácil: sort_order = 1500
  reordenar B e C              (espaço de sobra)
```

---

## Políticas RLS

### tasks (Tabela Principal)

| Operação | Policy | Condição |
|----------|--------|----------|
| SELECT | Users can read tasks from their org | `is_org_member(uid, org_id)` |
| INSERT | Users can create tasks in their org | `is_org_member(uid, org_id) AND user_id = uid` |
| UPDATE | Users can update their own tasks | `is_org_member(uid, org_id) AND user_id = uid` |
| DELETE | Users can delete their own tasks | `is_org_member(uid, org_id) AND user_id = uid` |

### task_subtasks (Subtarefas)

| Operação | Policy | Condição |
|----------|--------|----------|
| SELECT | Users can read subtasks from their org | `is_org_member(uid, org_id)` |
| INSERT | Users can create subtasks | Ver abaixo |
| UPDATE | Users can update their own subtasks | `is_org_member(uid, org_id) AND user_id = uid` |
| DELETE | Users can delete their own subtasks | `is_org_member(uid, org_id) AND user_id = uid` |

#### Policy INSERT Fortalecida (Hotfix)

A policy original não validava que a task pertencia ao usuário. Corrigimos para:

```sql
CREATE POLICY "Users can create subtasks"
  ON public.task_subtasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_member(auth.uid(), org_id)
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
        AND t.org_id = task_subtasks.org_id
        AND t.user_id = auth.uid()  -- NOVA CONDIÇÃO
    )
  );
```

Isso impede:
- Criar subtarefas em tasks de outros usuários
- Cross-org attacks via task_id manipulado

---

## Componentes e Serviços

### Frontend

```
src/
├── pages/app/Tasks.tsx          # Página principal
├── components/tasks/
│   ├── KanbanBoard.tsx          # Board com DragDropContext
│   ├── KanbanColumn.tsx         # Coluna droppable
│   ├── TaskCard.tsx             # Card draggable
│   ├── TaskModal.tsx            # Modal criar/editar
│   └── TodayTasksCard.tsx       # Card para Home
└── hooks/
    └── useTasks.tsx             # React Query hooks
```

### Backend (Service Layer)

```typescript
// src/services/tasks.ts

// Constantes
const GAP_SIZE = 1000;
const MIN_GAP = 2;

// CRUD
listTasks(orgId)
getTask(orgId, taskId)
createTask(orgId, userId, payload)
updateTask(orgId, userId, taskId, payload)
archiveTask(orgId, userId, taskId)

// Move com Gap Ordering
moveTask(orgId, userId, taskId, { status, destinationIndex })
reindexColumn(orgId, status, excludeTaskId?)  // interno

// Subtasks
createSubtask(orgId, userId, taskId, title)
toggleSubtask(orgId, userId, subtaskId, done)
deleteSubtask(orgId, userId, subtaskId)

// Home
getTodayPendingTasks(orgId)
```

---

## Audit Log

Todas as operações são registradas em `audit_log`:

| action | entity_type | meta |
|--------|-------------|------|
| `task_created` | task | title, status, priority, sort_order |
| `task_updated` | task | changes object |
| `task_moved` | task | from_status, to_status, sort_order, destination_index |
| `task_archived` | task | {} |
| `subtask_created` | subtask | task_id, title |
| `subtask_toggled` | subtask | done |
| `subtask_deleted` | subtask | {} |

---

## Migrações

1. **MIGRATION_0003_tasks.sql** - Schema inicial (tasks + task_subtasks + RLS)
2. **MIGRATION_0003_1_hotfix_tasks.sql** - Correções:
   - Policy INSERT fortalecida
   - Índice `tasks_org_user_idx`
   - Função `reindex_all_task_columns()`

---

## FAQ

### Por que GAP_SIZE = 1000?

Permite ~500 inserções no meio antes de precisar reindexar (1000 → 500 → 250 → 125 → ...). Número suficiente para uso normal.

### O reindex causa lentidão?

Não perceptivelmente. Uma coluna com 100 tasks leva ~100ms. Acontece raramente.

### Posso ter sort_order negativo?

Sim. O algoritmo pode gerar valores negativos (ex: inserir antes do primeiro). Isso é esperado e funciona corretamente.

### O que acontece se dois usuários moverem simultaneamente?

Cada operação é independente. Mesmo que dois sort_orders fiquem muito próximos, o reindex automático corrige na próxima movimentação.
