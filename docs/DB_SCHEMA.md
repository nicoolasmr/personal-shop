# Esquema do Banco de Dados - VIDA360

## Tabelas Principais

### Organizações e Perfis
-   `orgs`: Armazena os workspaces (tenants).
-   `profiles`: Detalhes dos usuários (nome, avatar, email).
-   `memberships`: Relaciona usuários a organizações com papéis (admin, member, owner).
-   `user_roles`: Gerenciamento fino de permissões.

### Produtividade e Hábitos
-   `habits`: Configuração de hábitos (frequência, meta semanal).
-   `habit_checkins`: Registros diários de conclusão de hábitos.
-   `tasks`: Quadro de tarefas Kanban.
-   `task_subtasks`: Checklist dentro de tarefas.
-   `task_attachments`: Arquivos anexados a tarefas.

### Metas (Goals)
-   `goals`: Objetivos de longo prazo (vários tipos: financeiro, hábito, etc).
-   `goal_progress`: Histórico de progresso manual ou automático.

### Finanças
-   `transaction_categories`: Categorias de despesas/receitas.
-   `transactions`: Lançamentos financeiros (com suporte a parcelamentos).
-   `finance_goals`: Metas específicas de economia ou reserva.

### Gamificação e Configurações
-   `user_settings`: Preferências de interface e notificações.
-   `user_achievements`: Conquistas desbloqueadas.
-   `audit_log`: Registro de ações para segurança e histórico.

## Relacionamentos Principais
-   A maioria das tabelas possui `org_id` e `user_id` para filtragem multi-tenant.
-   `goals` podem estar linkados a `habits` ou `finance_goals` através de triggers de sincronização.
