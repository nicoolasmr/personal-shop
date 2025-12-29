# Guia de Configuração (SETUP) - VIDA360

## Requisitos
-   Node.js (v18 ou superior)
-   npm ou yarn
-   Supabase CLI (opcional para desenvolvimento local)

## Passos Iniciais

1.  **Clonar o repositório**:
    ```bash
    git clone <repo-url>
    cd vida360
    ```

2.  **Instalar dependências**:
    ```bash
    npm install
    ```

3.  **Configurar Variáveis de Ambiente**:
    Crie um arquivo `.env` baseado no `.env.example`:
    ```bash
    VITE_SUPABASE_URL=sua_url_do_supabase
    VITE_SUPABASE_ANON_KEY=sua_chave_anonima
    ```

4.  **Iniciar Servidor de Desenvolvimento**:
    ```bash
    npm run dev
    ```

## Configuração do Supabase
-   Certifique-se de rodar as migrations localizadas em `/supabase/migrations/` no seu projeto Supabase.
-   Configure as Buckets de storage: `avatars`, `task-attachments`.
-   Habilite as permissões de Auth necessárias (Email/Senha).
