# Mapa de Rotas - VIDA360

## Rotas Públicas
-   `/login`: Tela de autenticação.
-   `/signup`: Tela de cadastro de novos usuários.
-   `/cadastro`: Alias para `/signup`.
-   `/status`: Página de status do sistema.
-   `/health`: Endpoint de saúde monitorado pela Edge Function.

## Rotas Privadas (App Shell)
*Todas as rotas abaixo estão sob o prefixo `/app` e protegidas pelo `AuthGuard`.*

-   `/app/home`: Dashboard principal com resumo de tudo.
-   `/app/tasks`: Quadro Kanban e lista de tarefas.
-   `/app/goals`: Gestão de Metas e Hábitos (abas).
-   `/app/habits`: Atalho que redireciona para `/app/goals?tab=habits`.
-   `/app/finance`: Gestão financeira, transações e metas de economia.
-   `/app/stats`: Estatísticas detalhadas de progresso e performance.
-   `/app/calendar`: Agenda visual de eventos e prazos.
-   `/app/profile`: Configuração de perfil do usuário e conquistas.
-   `/app/settings`: Configurações de tema, notificações e PWA.

## Catch-all
-   `*`: Redireciona para `/app/home` se logado, ou exibe `/login`.
