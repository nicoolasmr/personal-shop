# Arquitetura do Sistema - VIDA360

## Visão Geral
O VIDA360 é uma aplicação de gestão de vida e produtividade (Metas, Hábitos, Tarefas, Finanças) desenvolvida como um PWA (Progressive Web App) integrado ao Supabase.

## Tech Stack
-   **Frontend**: React (Vite) + TypeScript
-   **Estilização**: Tailwind CSS + shadcn/ui
-   **Gerenciamento de Estado/Cache**: TanStack Query (React Query)
-   **Backend (BaaS)**: Supabase (Auth, Database, Storage, Edge Functions)
-   **Gráficos**: Recharts
-   **Observabilidade**: Sentry (inicializado no `main.tsx`)

## Estrutura de Pastas
-   `/src/components`: Componentes reutilizáveis de UI e lógica de negócio.
-   `/src/contexts`: Contextos do React (ex: `AuthContext`).
-   `/src/hooks`: Hooks customizados e consultas (queries/mutations).
-   `/src/layouts`: Componentes de layout principal (`AppLayout`).
-   `/src/pages`: Páginas da aplicação.
-   `/src/services`: Camada de serviço para abstrair chamadas à API/Supabase.
-   `/src/types`: Definições de tipos TypeScript.
-   `/supabase`: Configurações e Edge Functions do Supabase.

## Fluxo de Autenticação
A autenticação é gerida pelo Supabase Auth. O `AuthContext` expõe o estado de sessão e o usuário para toda a aplicação. O `AuthGuard` protege as rotas privadas em `/app`.

## Persistência de Dados
Os dados são armazenados no PostgreSQL do Supabase, com políticas de RLS (Row Level Security) aplicadas para garantir o isolamento por Organização (Tenant) e Usuário.
