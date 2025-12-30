# VIDA360 Security Documentation

## Overview

O VIDA360 é uma aplicação multi-tenant de produtividade pessoal que implementa segurança em múltiplas camadas.

## Arquitetura de Segurança

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Validação de inputs (Zod)                         │   │
│  │  • AuthGuard protegendo rotas /app/*                 │   │
│  │  • Sem secrets no código (apenas env vars)           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Row Level Security (RLS) em TODAS as tabelas      │   │
│  │  • JWT validation automático                          │   │
│  │  • Security Definer functions para evitar recursão   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Princípios de Segurança

### 1. Zero Secrets no Código

❌ **NUNCA fazer isso:**
```typescript
const API_KEY = 'sk-1234567890abcdef';
const SUPABASE_URL = 'https://xxx.supabase.co';
```

✅ **Sempre usar env vars:**
```typescript
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### 2. Variáveis de Ambiente

| Variável | Tipo | Onde Configurar |
|----------|------|-----------------|
| `VITE_SUPABASE_URL` | Build-time | Lovable Secrets / Docker ARG / GitHub Secrets |
| `VITE_SUPABASE_ANON_KEY` | Build-time | Lovable Secrets / Docker ARG / GitHub Secrets |

**IMPORTANTE:** Variáveis `VITE_*` são embutidas no bundle durante o build (Vite). Não são variáveis de runtime.

### 2.1 Comportamento DEV vs PROD

> ⚠️ **REGRA CRÍTICA**: Fallback de env vars só é permitido em DEV, NUNCA em PROD.

| Modo | Fallback | Comportamento |
|------|----------|---------------|
| **PROD** | ❌ NÃO | Build/boot FALHA se `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` ausentes |
| **DEV** | ✅ SIM | Usa config de dev com `console.warn` (apenas para facilitar setup local) |
| **TEST** | ✅ SIM | Igual DEV |

**Por que isso é importante:**
- Fallback em PROD poderia expor configuração de desenvolvimento
- Garante que deploy só acontece com configuração correta
- DEV fallback é para conveniência local, não para produção

**Nunca commitar secrets:** Use GitHub Secrets, Lovable Cloud Secrets, or Kubernetes Secrets.

### 3. Chaves Públicas vs Privadas

| Chave | Pode estar no frontend? | Descrição |
|-------|-------------------------|-----------|
| `anon key` | ✅ SIM | Chave pública, acesso controlado por RLS |
| `service_role key` | ❌ NUNCA | Bypassa RLS, apenas para backend |

## Row Level Security (RLS)

### Por que RLS é obrigatório?

1. **Defense in depth**: Mesmo com bugs no frontend, dados ficam protegidos
2. **Multi-tenant safety**: Impossível vazar dados entre organizações
3. **Compliance**: Controle de acesso no nível do banco

### Tabelas e Policies

#### Tabelas Base (MIGRATION_0001)

| Tabela | RLS | Policies |
|--------|-----|----------|
| `orgs` | ✅ | SELECT: membership check |
| `profiles` | ✅ | SELECT/UPDATE: own profile |
| `memberships` | ✅ | SELECT: own memberships |
| `user_roles` | ✅ | Via has_role() function |
| `audit_log` | ✅ | INSERT/SELECT: own org |

#### Habits (MIGRATION_0002 + 0002_1 hotfix)

| Tabela | Operação | Policy |
|--------|----------|--------|
| `habits` | SELECT | `is_org_member(uid, org_id)` |
| `habits` | INSERT | `is_org_member(uid, org_id) AND user_id = uid` |
| `habits` | UPDATE | `is_org_member(uid, org_id) AND user_id = uid` |
| `habits` | DELETE | `is_org_member(uid, org_id) AND user_id = uid` |
| `habit_checkins` | SELECT | `is_org_member(uid, org_id)` |
| `habit_checkins` | INSERT | `is_org_member(uid, org_id) AND user_id = uid AND habit.user_id = uid` ✅ |
| `habit_checkins` | UPDATE | `is_org_member(uid, org_id) AND user_id = uid AND habit.user_id = uid` ✅ |
| `habit_checkins` | DELETE | `is_org_member(uid, org_id) AND user_id = uid AND habit.user_id = uid` ✅ |

#### Tasks (MIGRATION_0003 + 0003_1 hotfix)

| Tabela | Operação | Policy |
|--------|----------|--------|
| `tasks` | SELECT | `is_org_member(uid, org_id)` |
| `tasks` | INSERT | `is_org_member(uid, org_id) AND user_id = uid` |
| `tasks` | UPDATE | `is_org_member(uid, org_id) AND user_id = uid` |
| `tasks` | DELETE | `is_org_member(uid, org_id) AND user_id = uid` |
| `task_subtasks` | SELECT | `is_org_member(uid, org_id)` |
| `task_subtasks` | INSERT | `is_org_member(uid, org_id) AND user_id = uid AND task.user_id = uid` ✅ |
| `task_subtasks` | UPDATE | `is_org_member(uid, org_id) AND user_id = uid` |
| `task_subtasks` | DELETE | `is_org_member(uid, org_id) AND user_id = uid` |

#### User Settings & Achievements (MIGRATION_0007)

| Tabela | Operação | Policy |
|--------|----------|--------|
| `user_settings` | SELECT | `user_id = uid` |
| `user_settings` | INSERT | `user_id = uid` |
| `user_settings` | UPDATE | `user_id = uid` |
| `user_achievements` | SELECT | `user_id = uid` |
| `user_achievements` | INSERT | `user_id = uid` |

### Security Definer Functions

Para evitar recursão infinita em policies, usamos funções `SECURITY DEFINER`:

```sql
-- Verifica se usuário é membro da org
CREATE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = _user_id AND org_id = _org_id
  )
$$;

-- Verifica se usuário tem role específica
CREATE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

## Hotfixes de Segurança Aplicados

### MIGRATION_0002_1_hotfix_habits.sql

**Problema:** Policy INSERT de `habit_checkins` não validava ownership do hábito.

**Risco:** Usuário A poderia criar checkin para hábito do Usuário B (mesma org).

**Correção:**
```sql
CREATE POLICY "Users can create checkins"
  ON public.habit_checkins
  FOR INSERT
  WITH CHECK (
    is_org_member(auth.uid(), org_id)
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM habits h
      WHERE h.id = habit_id
        AND h.org_id = habit_checkins.org_id
        AND h.user_id = auth.uid()  -- NOVA CONDIÇÃO
    )
  );
```

### MIGRATION_0003_1_hotfix_tasks.sql

**Problema:** Policy INSERT de `task_subtasks` não validava ownership da task.

**Correção:** Mesmo padrão do hotfix de habits.

## Auditoria de Código

### Strings para Buscar (grep)

Para auditar o código, busque por estas strings:

```bash
# Deve retornar 0 matches em src/
grep -r "supabase.co" src/
grep -r "eyJ" src/              # JWT tokens começam com eyJ
grep -r "service_role" src/
grep -r "FALLBACK_" src/
grep -r "sk-" src/              # OpenAI/API keys
```

### Arquivos Permitidos com Referências

| Arquivo | Permitido | Razão |
|---------|-----------|-------|
| `src/config/supabase.ts` | `anonKey` (variável) | Nome da propriedade, não valor |
| `src/lib/env.ts` | `ANON_KEY` (string) | Validação de env var |
| `.env.example` | Placeholders | Documentação |

## Validação de Inputs

### Frontend (Zod)

```typescript
// Login
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

// Signup
const signupSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});
```

### Backend (RLS + Constraints)

- `CHECK` constraints no banco (ex: `status IN ('todo', 'doing', 'done')`)
- `NOT NULL` em campos obrigatórios
- `UNIQUE` constraints para evitar duplicatas
- RLS policies validando ownership

## Checklist de Segurança

- [x] RLS habilitado em todas as tabelas
- [x] Sem secrets hardcoded no código
- [x] Validação Zod no login/signup
- [x] Security headers no nginx
- [x] CORS configurado em edge functions
- [x] Ownership validation em INSERT de checkins/subtasks
- [x] Ownership validation em UPDATE/DELETE de checkins
- [x] Trigger de signup cria org isolada
- [x] Audit log para operações sensíveis
- [x] Storage policies com path enforcement
- [x] user_roles con RLS policy (MIGRATION_0019)
- [x] handle_new_user() con input validation (MIGRATION_0019)
- [x] Finance RPC functions con authorization checks (MIGRATION_0020)
- [x] Bug reports RLS org-scoped (MIGRATION_0020)

## Storage Security

### Bucket: avatars

| Operação | Policy | Path Pattern |
|----------|--------|--------------|
| INSERT | `avatars_insert_own_folder` | `{user_id}/filename.ext` |
| UPDATE | `avatars_update_own_folder` | `{user_id}/filename.ext` |
| DELETE | `avatars_delete_own_folder` | `{user_id}/filename.ext` |
| SELECT | `avatars_public_read` | Público (necessário para exibição) |

### Bucket: task-attachments

| Operação | Policy | Path Pattern |
|----------|--------|--------------|
| INSERT | `task_attachments_insert_own_org` | `{org_id}/{task_id}/filename.ext` |
| SELECT | `task_attachments_select_own_org` | `{org_id}/{task_id}/filename.ext` |
| UPDATE | `task_attachments_update_own` | `{org_id}/{task_id}/filename.ext` |
| DELETE | `task_attachments_delete_own` | `{org_id}/{task_id}/filename.ext` |

### Validações Aplicadas

1. **Path enforcement**: Primeiro folder deve ser `user_id` (avatars) ou `org_id` (attachments)
2. **Ownership check**: Tasks devem pertencer ao usuário autenticado
3. **Org isolation**: Attachments só visíveis para membros da mesma org
4. **No bucket listing**: Usuários não podem listar todo o bucket

### Código de Upload (Frontend)

```typescript
// Avatars - correto
const path = `${user.id}/avatar.png`;
await supabase.storage.from('avatars').upload(path, file);

// Task attachments - correto
const path = `${org.id}/${task.id}/${attachmentId}.pdf`;
await supabase.storage.from('task-attachments').upload(path, file);
```

## Bug Reports (Sprint 3.5)

### Tabela: bug_reports

| Operação | Policy | Condição |
|----------|--------|----------|
| INSERT | `bug_reports_insert` | `is_org_member(uid, org_id) AND user_id = uid` |
| SELECT | `bug_reports_select_own_or_admin` | `user_id = uid` OU `(admin/owner) AND org_id = caller_org_id` ✅ |
| UPDATE | - | Negado (imutável) |
| DELETE | - | Negado (imutável) |

**Justificativa:** Bug reports são imutáveis para manter integridade do registro. Apenas o autor ou admins/owners **da mesma org** podem visualizar.

> ⚠️ **Correção (MIGRATION_0020)**: Policy anterior permitia admin/owner de qualquer org ver todos os reports. Agora é org-scoped.

## Push Rate Limits (Sprint 3.5)

### Tabela: push_rate_limits

| Operação | Policy | Condição |
|----------|--------|----------|
| ALL | Service Role | Edge function usa service role |

**Nota:** Esta tabela é gerenciada pela edge function `send-push` com service role. RLS está habilitado mas políticas permitem operações via service role para o rate limiting funcionar.

### Função: check_push_rate_limit

```sql
CREATE FUNCTION check_push_rate_limit(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
```

- Retorna `true` se dentro do limite
- Retorna `false` se rate limit excedido
- Incrementa contador automaticamente

## Security Hardening (Sprint 3.5.6)

### MIGRATION_0019: User Roles RLS & Input Validation

**Correções aplicadas:**

1. **user_roles RLS Policy**: Adicionada política para usuários lerem suas próprias roles
   ```sql
   CREATE POLICY "Users can read own roles" ON public.user_roles
     FOR SELECT USING (auth.uid() = user_id);
   ```

2. **handle_new_user() Input Validation**: Função de trigger agora valida e sanitiza `full_name`:
   - Trim de whitespace
   - Limite de 255 caracteres
   - Default para 'Usuário' se vazio/null

### MIGRATION_0020: RPC Authorization & RLS Fixes

**Problema identificado:** Funções RPC de finanças (`get_monthly_summary`, `get_category_breakdown`, `get_installments_summary`) aceitavam parâmetros `org_id` e `user_id` sem verificar autorização, permitindo acesso a dados de outras organizações.

**Correções aplicadas:**

1. **Finance RPC Authorization**: Todas as funções agora validam:
   ```sql
   -- Get caller's org_id
   SELECT org_id INTO v_caller_org_id 
   FROM public.profiles 
   WHERE user_id = auth.uid();
   
   -- Verify caller belongs to requested org
   IF v_caller_org_id IS NULL OR v_caller_org_id != p_org_id THEN
     RAISE EXCEPTION 'Unauthorized: cannot access other organization data';
   END IF;
   
   -- Verify target user belongs to same org
   IF NOT EXISTS(
     SELECT 1 FROM public.profiles 
     WHERE user_id = p_user_id AND org_id = p_org_id
   ) THEN
     RAISE EXCEPTION 'Invalid user_id for organization';
   END IF;
   ```

2. **Bug Reports RLS Fix**: Policy `bug_reports_select_own_or_admin` atualizada para ser org-scoped:
   ```sql
   CREATE POLICY "bug_reports_select_own_or_admin"
     ON public.bug_reports
     FOR SELECT
     TO authenticated
     USING (
       user_id = auth.uid()
       OR (
         (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
         AND org_id = (SELECT org_id FROM public.profiles WHERE user_id = auth.uid())
       )
     );
   ```

### Funções RPC Protegidas

| Função | Autorização | Status |
|--------|-------------|--------|
| `get_monthly_summary` | ✅ Caller deve pertencer à org solicitada | Corrigido |
| `get_category_breakdown` | ✅ Caller deve pertencer à org solicitada | Corrigido |
| `get_installments_summary` | ✅ Caller deve pertencer à org solicitada | Corrigido |

### Impacto das Correções

- **Multi-tenant isolation**: Garantido em todas as funções RPC
- **Cross-org data exposure**: Bloqueado
- **RLS bypass via RPC**: Prevenido con verificação explícita de autorização

### Edge Function: send-push Hardening (v3.5.7)

**Problema identificado:** A Edge Function `send-push` permitia que usuários autenticados enviassem notificações para qualquer `user_id` do sistema (cross-tenant spam).

#### Matriz de Autorização (Hardened)

A autorização é verificada em tempo de execução via `adminClient` (bypassing RLS apenas para metadados).

| Alvo | Contexto do Caller | Resultado | Ação Adicional |
| :--- | :--- | :--- | :--- |
| **Si mesmo** | `target_user_id == caller_id` | ✅ Permitido | - |
| **Broadcast Org** | `target_org_id == caller_org_id` | ✅ Permitido | - |
| **Broadcast Org** | `target_org_id != caller_org_id` | ❌ **403 Forbidden** | Audit Log: `cross_org` |
| **Outro Usuário** | `target_org_id == caller_org_id` AND role ∈ {admin, owner} | ✅ Permitido | - |
| **Outro Usuário** | `target_org_id == caller_org_id` AND role == member | ❌ **403 Forbidden** | Audit Log: `not_privileged` |
| **Outro Usuário** | `target_org_id != caller_org_id` | ❌ **403 Forbidden** | Audit Log: `cross_org` |

#### Sanitização de URLs

Para prevenir ataques de phishing, esquemas de URL são restritos:
- ✅ **Caminhos relativos:** `/app/...`
- ✅ **URLs absolutas:** Somente `https://...`
- ❌ **Bloqueados:** `http://`, `javascript:`, `data:`, `//` (schemaless).

#### Rate Limiting

Implementado via RPC `check_push_rate_limit`:
- **Retorno:** `429 Too Many Requests` se o limite for atingido.
- **Escopo:** Por Usuário e por Organização.

#### Observabilidade (Privacy-First)

Os logs da Edge Function **NÃO** contêm PII:
- 🚫 Sem tokens JWT ou secrets
- 🚫 Sem endpoints de assinatura (endpoints de push)
- 🚫 Sem o conteúdo completo (`title`/`body`) das mensagens
- ✅ Registramos: `caller_user_id`, `caller_org_id`, `target_type`, `success`, `reason`, `title_len`, `body_len`.

## RLS Regression Checks

### Nota sobre schema_migrations

> ⚠️ **IMPORTANTE**: A tabela `schema_migrations` é uma tabela de tracking interno que registra quais migrations foram aplicadas. Ela **pode ter `rowsecurity=false`** por design, pois não contém dados de usuário. O gate de RLS deve exigir `rowsecurity=true` apenas para tabelas de dados do usuário.

### Queries de Verificação

Execute periodicamente para garantir que RLS está ativo em tabelas de dados do usuário:

```sql
-- 1. Verificar RLS em tabelas de dados (excluindo schema_migrations)
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅' ELSE '❌ VERIFICAR!' END as status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename NOT IN ('schema_migrations')
ORDER BY rowsecurity, tablename;

-- 2. Listar policies por tabela (deve ter pelo menos 1 por tabela com RLS)
SELECT 
  tablename,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 3. Auditar policies de user_roles
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_roles'
ORDER BY policyname;
-- Esperado: 0 policies de INSERT/UPDATE/DELETE para authenticated sem restrição

-- 4. Verificar tabelas sensíveis
SELECT 
  t.tablename,
  CASE 
    WHEN t.rowsecurity THEN '✅ RLS ON'
    ELSE '❌ RLS OFF'
  END as rls_status,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'user_roles', 'memberships', 'profiles', 
    'goals', 'habits', 'tasks', 
    'transactions', 'bug_reports', 'push_subscriptions'
  )
ORDER BY t.tablename;
```

### Teste de Escalada de Privilégio (user_roles)

> ⚠️ **IMPORTANTE**: Nunca usar placeholders como `...` ou `<udt_name>` em SQL.

**Passo 1 - Descobrir o tipo real do campo role:**

```sql
SELECT udt_schema, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_roles'
  AND column_name = 'role';
```

**Passo 2 - Teste de INSERT (deve FALHAR com RLS):**

Se o enum é `public.app_role`:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES (auth.uid(), 'admin'::public.app_role);
```

**Resultado esperado**: `ERROR: new row violates row-level security policy`

**Se INSERT passar**: Vulnerabilidade crítica! Aplicar hardening imediatamente (ver QA.md).

### Notas Importantes sobre Sintaxe SQL

1. **Nunca usar `...` como placeholder** - Causa syntax error
2. **Nunca usar `<nome>` como placeholder** - Causa syntax error
3. **Tipos ENUM**: Use cast correto, ex: `'admin'::public.app_role`
4. **auth.uid()**: Só funciona em contexto autenticado (RLS)
5. **Service Role**: Bypassa RLS - nunca exponha no frontend

### Limitação do SQL Editor

O Supabase SQL Editor pode executar con permissões elevadas. Para prova definitiva de RLS:

| Método | Confiabilidade |
|--------|----------------|
| App autenticado (client JWT) | ⭐⭐⭐ Alta |
| Playwright E2E test | ⭐⭐⭐ Alta |
| SQL Editor (postgres role) | ⭐ Baixa |

## Contato

Para reportar vulnerabilidades de segurança, entre en contato con a equipe de desenvolvimento.
