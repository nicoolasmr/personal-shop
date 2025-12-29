# Políticas de Segurança e RLS - VIDA360

## Filosofia de Segurança
O VIDA360 utiliza o paradigma **Multi-tenant** no nível do banco de dados através do Supabase Row Level Security (RLS). Cada registro está obrigatoriamente vinculado a uma `org_id`.

## Regras de RLS por Tabela

### Profiles
-   `SELECT`: O usuário pode ler o próprio perfil. Admins da organização podem ler perfis de membros.
-   `UPDATE`: Somente o próprio usuário pode atualizar seus dados básicos.

### Habitos, Tarefas e Metas
-   `ALL`: O usuário tem acesso total aos seus próprios registros (`user_id = auth.uid()`).
-   `SELECT`: Membros da mesma organização podem visualizar (se configurado), mas geralmente o acesso é estrito ao dono.

### Finanças
-   `ALL`: Acesso restrito exclusivamente ao dono do registro. Nem mesmo admins da organização possuem acesso por padrão para garantir privacidade financeira máxima.

## RPCs de Segurança
-   `has_role(_user_id, _role)`: Verifica se o usuário possui um papel específico na organização atual.

## Hardening
-   Utilização de triggers para validação de `org_id` em operações de escrita.
-   Desabilitação de acesso direto a tabelas críticas sem passar por RLS.
