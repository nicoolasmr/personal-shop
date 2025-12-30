# VIDA360 Quality Assurance Guide

## Overview

Este documento descreve os processos de QA, comandos de teste e checklist de release do VIDA360.

## Comandos de Teste

### Scripts Disponíveis

```bash
# TypeScript check (sem emitir arquivos)
npm run typecheck

# Lint com ESLint
npm run lint

# Testes unitários (watch mode)
npm run test

# Testes unitários (single run - CI)
npm run test:run

# Testes E2E com Playwright
npm run e2e

# Build de produção
npm run build

# Preview do build
npm run preview
```

### Executar Todos os Gates

```bash
# Sequência completa de QA (sem E2E)
npm run typecheck && npm run test:run && npm run build

# Com E2E (requer app rodando ou preview)
npm run typecheck && npm run test:run && npm run build && npm run e2e

# OU usar scripts padronizados (se disponíveis)
# npm run gates:beta   # typecheck + test + build
# npm run gates:full   # typecheck + test + build + e2e
```

### Variáveis de Ambiente para E2E

Os testes E2E que requerem autenticação usam:

| Variável | Descrição |
|----------|-----------|
| `E2E_EMAIL` | Email do usuário de teste |
| `E2E_PASSWORD` | Senha do usuário de teste |

**Configurar no CI:**
```yaml
env:
  E2E_EMAIL: ${{ secrets.E2E_EMAIL }}
  E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
```

**Configurar localmente:**
```bash
export E2E_EMAIL="test@example.com"
export E2E_PASSWORD="testpassword"
npm run e2e
```

> ⚠️ **NUNCA hardcode credenciais no código ou em arquivos commitados.**

## Env Gate — Validação de Variáveis de Ambiente

### Comportamento DEV vs PROD

| Modo | Comportamento | Fallback |
|------|---------------|----------|
| **PROD** | STRICT - build/boot falha se vars ausentes | ❌ NÃO |
| **DEV** | LENIENT - usa fallback com warning | ✅ SIM |
| **TEST** | Igual DEV | ✅ SIM |

### Checklist Env Gate

- [ ] Build em PROD falha se `VITE_SUPABASE_URL` ausente
- [ ] Build em PROD falha se `VITE_SUPABASE_ANON_KEY` ausente
- [ ] DEV roda sem vars obrigatórias (usa fallback interno)
- [ ] Console.warn emitido UMA VEZ em DEV quando usando fallback
- [ ] Variáveis opcionais (`VITE_VAPID_PUBLIC_KEY`, `VITE_SENTRY_DSN`, `VITE_APP_VERSION`) nunca causam erro

### Validação Manual

```bash
# Teste PROD sem vars (deve falhar)
VITE_SUPABASE_URL="" VITE_SUPABASE_ANON_KEY="" npm run build

# Teste DEV sem vars (deve funcionar com warning)
npm run dev
# Verificar console para: "[ENV] Using DEV fallback for Supabase config."

# Teste PROD com vars (deve passar)
VITE_SUPABASE_URL="https://xxx.supabase.co" VITE_SUPABASE_ANON_KEY="xxx" npm run build
```

## Pipeline CI/CD

### GitHub Actions

O pipeline CI (``.github/workflows/ci.yml``) executa automaticamente em:
- Push para `main` ou `develop`
- Pull requests para `main`

### Jobs

1. **quality** - Fail-fast quality gates:
   - Install dependencies
   - TypeScript check
   - Lint
   - Unit tests
   - Build

2. **e2e** - End-to-end tests (após quality passar):
   - Playwright tests
   - Artifacts do relatório

### Configuração de Secrets

| Secret | Descrição | Obrigatório |
|--------|-----------|-------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Para E2E real |
| `VITE_SUPABASE_ANON_KEY` | Chave anon do Supabase | Para E2E real |

## Estrutura de Testes

### Testes Unitários (Vitest)

```
src/
├── services/__tests__/
│   ├── goals.test.ts
│   ├── habits.test.ts
│   └── tasks.test.ts
├── lib/__tests__/
│   └── env.test.ts
└── test/
    └── setup.ts
```

### Testes E2E (Playwright)

```
e2e/
├── auth.spec.ts      # Login/signup flows
├── goals.spec.ts     # Goals CRUD
├── habits.spec.ts    # Habits CRUD
└── navigation.spec.ts # Routing tests
```

### Browsers Testados

- Chromium (Desktop)
- Firefox (Desktop)
- WebKit (Desktop Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Checklist de Release

### Pré-Release

- [ ] Todos os testes passando (`npm run test:run`)
- [ ] Build sem erros (`npm run build`)
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Lint sem erros críticos (`npm run lint`)
- [ ] E2E passando em Chromium (`npm run e2e -- --project=chromium`)
- [ ] Migrations documentadas em `docs/`
- [ ] CHANGELOG atualizado

### Migrations

- [ ] Migration tem número sequencial correto
- [ ] Migration está registrada em `schema_migrations`
- [ ] Rollback documentado (se aplicável)
- [ ] RLS policies verificadas

### Security

- [ ] Sem secrets hardcoded no código
- [ ] RLS habilitado em tabelas de dados do usuário (ver nota abaixo)
- [ ] Storage policies seguem padrão de path
- [ ] Inputs validados com Zod
- [ ] Testes de escalada de privilégio executados (ver seção RLS Escalation Test)

> ⚠️ **Nota RLS**: A tabela `schema_migrations` pode ter `rowsecurity=false` por design (é tabela de tracking interno, não contém dados do usuário). O gate de RLS deve exigir `rowsecurity=true` apenas para tabelas de dados do usuário.

## RLS Escalation Test - user_roles

**Objetivo**: Verificar que usuários comuns não podem se auto-promover a roles privilegiadas.

### IMPORTANTE: Nunca usar placeholders inválidos

- ❌ ERRADO: `VALUES (auth.uid(), 'admin'::<udt_name>)` 
- ❌ ERRADO: `INSERT INTO user_roles (...)`
- ✅ CORRETO: Descobrir enum via SQL primeiro

### Passo 1 - Descobrir o ENUM real do campo role

```sql
SELECT udt_schema, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_roles'
  AND column_name = 'role';
```

**Resultado esperado**: Retorna o schema e nome do enum (ex: `public`, `app_role`)

### Passo 2 - Listar valores válidos do ENUM

Substituir `ROLE_ENUM_NAME` pelo valor retornado no Passo 1:

```sql
SELECT e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'ROLE_ENUM_NAME'
ORDER BY e.enumsortorder;
```

**Exemplo** (se udt_name = `app_role`):

```sql
SELECT e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'app_role'
ORDER BY e.enumsortorder;
```

### Passo 3 - Teste de Escalada (DEVE FALHAR)

Substituir os valores descobertos:

```sql
-- Substituir ROLE_VALUE pelo valor do enum (ex: admin)
-- Substituir ROLE_ENUM_SCHEMA.ROLE_ENUM_NAME (ex: public.app_role)
INSERT INTO public.user_roles (user_id, role)
VALUES (auth.uid(), 'ROLE_VALUE'::ROLE_ENUM_SCHEMA.ROLE_ENUM_NAME);
```

**Exemplo concreto** (se schema = public, enum = app_role, valor = admin):

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES (auth.uid(), 'admin'::public.app_role);
```

**Resultado esperado**: 
- Se seguro: Erro de RLS (`new row violates row-level security policy`)
- Se vulnerável: Insert passa → CORRIGIR IMEDIATAMENTE

### Passo 4 - Verificar RLS está ativo em tabelas de dados

> ⚠️ **Nota**: `schema_migrations` é tabela de tracking interno e pode ter `rowsecurity=false` por design.

**Query com exclusão de tabelas de sistema:**

```sql
SELECT tablename, rowsecurity,
  CASE WHEN rowsecurity THEN '✅' ELSE '❌ VERIFICAR' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN ('schema_migrations')
ORDER BY rowsecurity, tablename;
```

**OU query com whitelist de tabelas de dados do usuário:**

```sql
SELECT tablename, rowsecurity,
  CASE WHEN rowsecurity THEN '✅' ELSE '❌ CRÍTICO!' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'orgs', 'profiles', 'memberships', 'user_roles', 'audit_log',
    'habits', 'habit_checkins', 'habit_logs',
    'goals', 'goal_progress',
    'tasks', 'task_subtasks', 'task_attachments',
    'transactions', 'transaction_categories', 'finance_goals', 'budgets',
    'push_subscriptions', 'push_rate_limits',
    'bug_reports', 'notifications',
    'calendar_events', 'google_calendar_tokens',
    'user_settings', 'user_achievements', 'user_xp', 'user_profiles',
    'achievements', 'focus_sessions', 'projects', 'users'
  )
ORDER BY rowsecurity, tablename;
```

**Resultado esperado**: Todas as tabelas listadas devem ter `rowsecurity = true`.

### Passo 5 - Verificar RLS simples (legacy)

```sql
-- Query simples (pode gerar falso positivo para schema_migrations)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'user_roles';
```

**Resultado esperado**: `rowsecurity = true`

### Passo 6 - Listar policies atuais

```sql
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_roles'
ORDER BY policyname;
```

### Passo 7 - Hardening (se necessário)

Se o teste de escalada passou (INSERT funcionou), aplicar correção:

```sql
-- (A) Garantir RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- (B) Dropar policies perigosas
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname='public' AND tablename='user_roles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol.policyname);
  END LOOP;
END $$;

-- (C) Permitir só leitura do próprio registro
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- (D) Sem policies de INSERT/UPDATE/DELETE => negado por padrão
```

### Passo 8 - Repetir teste de escalada

Após hardening, repetir Passo 3. Deve falhar com erro de RLS.

### Documentação

- [ ] README atualizado (se mudanças significativas)
- [ ] RUNBOOK atualizado (se novos procedimentos)
- [ ] SECURITY.md atualizado (se novas policies)

## Debugging de Testes

### Testes Falhando Localmente

```bash
# Rodar teste específico
npm run test:run -- --grep "nome do teste"

# Rodar com logs
DEBUG=* npm run test:run

# E2E com UI mode
npx playwright test --ui

# E2E com debug
npx playwright test --debug
```

### Testes Flaky

1. Verificar timeouts (aumentar se necessário)
2. Checar race conditions em async operations
3. Usar `waitFor` em vez de delays fixos
4. Verificar cleanup entre testes

### CI Falhando

1. Verificar logs do GitHub Actions
2. Baixar artifacts de playwright-report
3. Comparar com execução local
4. Verificar se secrets estão configurados

## Coverage

### Gerar Relatório

```bash
npm run test:run -- --coverage
```

### Metas de Coverage

| Área | Meta |
|------|------|
| Services | > 80% |
| Hooks | > 60% |
| Utils | > 90% |
| Components | > 40% |

## Manutenção

### Atualizar Snapshots

```bash
npm run test:run -- --update
```

### Atualizar Browsers Playwright

```bash
npx playwright install --with-deps
```

### Limpar Cache

```bash
rm -rf node_modules/.vitest
rm -rf playwright-report
rm -rf test-results
```
