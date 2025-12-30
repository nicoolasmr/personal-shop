# VIDA360 Runbook

Manual operacional para setup, deploy e troubleshooting do VIDA360.

## Índice

1. [Setup Local](#setup-local)
2. [Variáveis de Ambiente](#variáveis-de-ambiente)
3. [Migrations](#migrations)
4. [Deploy](#deploy)
5. [Health Checks](#health-checks)
6. [Troubleshooting](#troubleshooting)

---

## Setup Local

### Pré-requisitos

- Node.js 20+
- npm ou bun
- Conta no Supabase (ou Lovable Cloud)

### Passos

```bash
# 1. Clonar o repositório
git clone <repo-url>
cd vida360

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com valores do Supabase

# 4. Iniciar em modo desenvolvimento
npm run dev
```

### Verificar Setup

1. Acesse `http://localhost:5173`
2. Se aparecer "Setup Required", configure as env vars
3. Faça login ou crie uma conta

---

## Variáveis de Ambiente

### Comportamento DEV vs PROD

> ⚠️ **IMPORTANTE**: O comportamento de validação de env vars muda conforme o modo.

| Modo | Comportamento | Fallback Permitido |
|------|---------------|-------------------|
| **PROD** (`import.meta.env.PROD`) | STRICT - throw se vars obrigatórias ausentes | ❌ NÃO |
| **DEV** (`import.meta.env.DEV`) | LENIENT - usa fallback com warning | ✅ SIM |
| **TEST** | Igual DEV | ✅ SIM |

**Em PROD**: O build/boot FALHA se `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` estiverem ausentes.

**Em DEV**: O app usa fallback (projeto de dev) e emite warning no console uma vez.

### Variáveis Obrigatórias (PROD)

| Variável | Descrição | Onde Obter |
|----------|-----------|------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Chave pública (anon) | Supabase Dashboard → Settings → API |

### Variáveis Opcionais

| Variável | Descrição | Default |
|----------|-----------|---------|
| `VITE_VAPID_PUBLIC_KEY` | Chave VAPID para push notifications | null (push desabilitado) |
| `VITE_SENTRY_DSN` | DSN do Sentry para error tracking | null (logs locais apenas) |
| `VITE_APP_VERSION` | Versão da aplicação | "dev" |

### Variáveis E2E (CI/Local)

| Variável | Descrição | Onde Configurar |
|----------|-----------|-----------------|
| `E2E_EMAIL` | Email do usuário de teste | GitHub Secrets / Local env |
| `E2E_PASSWORD` | Senha do usuário de teste | GitHub Secrets / Local env |

### Configuração por Ambiente

| Ambiente | Como Configurar |
|----------|-----------------|
| **Lovable** | Project Settings → Cloud → Secrets |
| **Docker** | `--build-arg VITE_SUPABASE_URL=...` |
| **Kubernetes** | `k8s/secret.yaml` (base64 encoded) |
| **Local** | Arquivo `.env` na raiz |
| **GitHub Actions** | Repository Secrets |

### IMPORTANTE: Build-time vs Runtime

As variáveis `VITE_*` são **embutidas no bundle durante o build** (Vite). Isso significa:

- ✅ Precisam estar disponíveis no momento do `npm run build`
- ❌ Não podem ser alteradas após o build sem rebuild
- ✅ São seguras para chaves públicas (anon key)
- ❌ Nunca use para chaves privadas (service_role)

### Nunca Commitar Secrets

- ❌ Não commitar `.env` com valores reais
- ❌ Não hardcodar chaves no código
- ✅ Usar GitHub Secrets, Lovable Cloud Secrets, ou K8s Secrets

---

## Migrations

### Source of Truth: Contagens Dinâmicas

> ⚠️ **IMPORTANTE**: Nunca afirmar números fixos de migrations. Use comandos para derivar contagens.

#### Contagem do Repositório (Arquivos)

```bash
# Contar arquivos de migration
ls -1 docs/MIGRATION_*.sql | wc -l

# Listar ordenado
ls -1 docs/MIGRATION_*.sql | sort
```

#### Contagem do Banco de Dados (Migrations Aplicadas)

```sql
-- Verificar se tabela de tracking existe
SELECT to_regclass('public.schema_migrations') AS schema_migrations_regclass;

-- Contar migrations aplicadas (SOURCE OF TRUTH)
SELECT COUNT(*)::int AS applied_migrations FROM public.schema_migrations;

-- Listar todas migrations aplicadas
SELECT filename, applied_at
FROM public.schema_migrations
ORDER BY applied_at DESC;
```

### Reconciliação: Repo vs DB

| Passo | Ação | Comando/Query |
|-------|------|---------------|
| 1 | Exportar lista do repo | `ls -1 docs/MIGRATION_*.sql \| sort` |
| 2 | Exportar lista do DB | `SELECT filename FROM schema_migrations ORDER BY filename` |
| 3 | Comparar listas | Se arquivo no repo não está no DB → aplicar na ordem abaixo |
| 4 | Investigar drift | Se filename no DB não existe no repo → arquivo renomeado/deletado |

### Ordem de Execução

Execute as migrations na ordem exata no **Supabase SQL Editor**:

| # | Arquivo | Descrição |
|---|---------|-----------|
| 1 | `MIGRATION_0001.sql` | Base: orgs, profiles, memberships, user_roles, audit_log |
| 2 | `MIGRATION_0002_habits.sql` | Habits + habit_checkins + RLS |
| 3 | `MIGRATION_0002_1_hotfix_habits.sql` | **Hotfix:** RLS checkins INSERT ownership |
| 4 | `MIGRATION_0002_2_hotfix_habit_checkins_update_delete.sql` | **Hotfix:** RLS checkins UPDATE/DELETE ownership |
| 5 | `MIGRATION_0003_weekly_goal.sql` | Adiciona weekly_goal a habits |
| 6 | `MIGRATION_0003_tasks.sql` | Tasks + task_subtasks + RLS |
| 7 | `MIGRATION_0003_1_hotfix_tasks.sql` | **Hotfix:** RLS subtasks + reindex function |
| 8 | `MIGRATION_0004_task_attachments.sql` | Task attachments + storage bucket |
| 9 | `MIGRATION_0005_avatar.sql` | Avatar storage bucket |
| 10 | `MIGRATION_0006_habit_reminders.sql` | Habit reminders |
| 11 | `MIGRATION_0007_user_settings_achievements.sql` | User settings + achievements |
| 12 | `MIGRATION_0008_goals.sql` | **Sprint 3.0:** Goals + goal_progress + trigger |
| 13 | `MIGRATION_0008_1_schema_migrations.sql` | Tracking de migrations (source of truth) |
| 14 | `MIGRATION_0008_2_goals_integrity.sql` | Constraints, índices, trigger robusta |
| 15 | `MIGRATION_0009_finance.sql` | **Sprint 3.1:** Finance module (transactions) |
| 16 | `MIGRATION_0009_1_habit_goal_sync.sql` | Habit → Goal progress sync |
| 17 | `MIGRATION_0010_push_subscriptions.sql` | **Sprint 3.4:** Push notifications |
| 18 | `MIGRATION_0011_finance_goals_trigger.sql` | Finance → Goals automatic sync |
| 19 | `MIGRATION_0012_storage_hardening.sql` | Storage bucket security policies |
| 20 | `MIGRATION_0013_finance_sync_idempotent.sql` | Finance sync idempotency (integration_key) |
| 21 | `MIGRATION_0014_payment_methods_installments.sql` | Payment methods + installments |
| 22 | `MIGRATION_0015_finance_goals.sql` | Finance goals module |
| 23 | `MIGRATION_0016_goal_finance_sync.sql` | Goal ↔ Finance bidirectional sync |
| 24 | `MIGRATION_0017_bug_reports.sql` | **Sprint 3.5:** Bug reports + RLS |
| 25 | `MIGRATION_0018_push_rate_limit.sql` | **Sprint 3.5:** Push rate limiting |

> **Nota:** Esta lista é de referência. A contagem real deve ser obtida via `ls` (repo) ou `schema_migrations` (DB).

### IMPORTANTE: Registrar Migrations

**Regra obrigatória:** Toda migration aplicada DEVE ser registrada em `schema_migrations`.

A partir da migration 0008_1, isso é feito automaticamente. Para migrations anteriores, execute 0008_1 que registra o histórico retroativamente.

### Verificar Migrations Aplicadas (Source of Truth)

```sql
-- Ver todas migrations aplicadas
SELECT filename, applied_at, notes 
FROM public.schema_migrations 
ORDER BY applied_at DESC;

-- Verificar se migration específica foi aplicada
SELECT public.is_migration_applied('MIGRATION_0008_goals.sql');
```

### Verificação Alternativa (por tabelas)

Execute no **Supabase SQL Editor** para validar o estado real do banco:

```sql
-- 1. Verificar tabelas críticas existem
SELECT table_name, 
  CASE WHEN table_name IN ('orgs', 'profiles', 'memberships', 'habits', 'habit_checkins', 
                           'tasks', 'task_subtasks', 'task_attachments', 'user_settings', 
                           'user_achievements', 'goals', 'goal_progress', 'schema_migrations',
                           'audit_log', 'user_roles')
       THEN '✅ Esperada' ELSE '⚠️ Extra' END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Verificar RLS habilitado
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Verificar policies por tabela
SELECT tablename, count(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 4. Verificar storage buckets
SELECT id, name, public 
FROM storage.buckets 
WHERE id IN ('avatars', 'task-attachments');

-- 5. Verificar triggers de Goals
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'public.goal_progress'::regclass;
```

### Resolver Schema Cache

Se aparecer erro "could not find table X in schema cache":

```sql
-- Forçar reload do schema cache do PostgREST
NOTIFY pgrst, 'reload schema';
```

Aguarde ~10 segundos ou vá em: Supabase Dashboard → Settings → API → "Reload schema"

### Checklist de Migrations por Tabela

| Tabela | Migration Necessária | Depende de |
|--------|---------------------|------------|
| `orgs`, `profiles`, `memberships` | 0001 | - |
| `habits`, `habit_checkins` | 0002 | 0001 |
| (policies hotfix habits) | 0002_1, 0002_2 | 0002 |
| `habits.weekly_goal` | 0003_weekly_goal | 0002 |
| `tasks`, `task_subtasks` | 0003_tasks | 0001 |
| (policies hotfix tasks) | 0003_1 | 0003_tasks |
| `task_attachments`, bucket | 0004 | 0003_tasks |
| `profiles.avatar_url`, bucket | 0005 | 0001 |
| `habits.reminder_time` | 0006 | 0002 |
| `user_settings`, `user_achievements` | 0007 | 0001 |
| `goals`, `goal_progress` | 0008 | 0001 |
| `schema_migrations` | 0008_1 | 0008 |
| (goals constraints/indices) | 0008_2 | 0008, 0008_1 |

### Rollback

Não há scripts de rollback automáticos. Para reverter:

1. Faça backup do banco antes de aplicar migrations
2. Use `DROP TABLE` ou `DROP POLICY` manualmente se necessário
3. Cuidado com CASCADE em tabelas com FKs

---

## Deploy

### Docker

```bash
# Build
docker build \
  --build-arg VITE_SUPABASE_URL="https://xxx.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="eyJ..." \
  -t vida360:latest .

# Run
docker run -p 3000:80 vida360:latest

# Verificar
curl http://localhost:3000/api/health
```

### Docker Compose

```bash
# Configurar .env with as variáveis
export VITE_SUPABASE_URL="https://xxx.supabase.co"
export VITE_SUPABASE_ANON_KEY="eyJ..."

# Subir
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

### Kubernetes

```bash
# 1. Configurar secrets (editar co valores reais base64)
kubectl apply -f k8s/secret.yaml

# 2. Aplicar configmap
kubectl apply -f k8s/configmap.yaml

# 3. Deploy da aplicação
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# 4. Verificar pods
kubectl get pods -l app=vida360
kubectl logs -l app=vida360 --tail=100
```

---

## Health Checks

### Endpoints Disponíveis

| Endpoint | Tipo | Auth | Descrição |
|----------|------|------|-----------|
| `/api/health` | Nginx interno | Não | Health check do container |
| `/functions/v1/health` | Edge Function | Não | Health check co teste Supabase |

### Health Check Local (Nginx)

```bash
curl http://localhost:3000/api/health
# Resposta: {"status":"ok","service":"vida360","timestamp":"..."}
```

### Health Check Edge Function

```bash
curl https://xxx.supabase.co/functions/v1/health
# Resposta:
# {
#   "status": "ok",
#   "service": "vida360",
#   "supabase": {
#     "configured": true,
#     "connected": true
#   }
# }
```

### Status Codes

| Status | Significado |
|--------|-------------|
| `ok` | Tudo funcionando |
| `degraded` | Supabase configurado mas não conectado |
| `error` | Supabase não configurado |

---

## Troubleshooting

### Problema: "Setup Required" aparece

**Causa:** Variáveis de ambiente não configuradas.

**Solução:**
1. Verificar se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão definidas
2. No Lovable: Project Settings → Cloud → Secrets
3. Rebuild a aplicação após configurar

### Problema: "RLS policy violation" ao inserir dados

**Causa:** Usuário tentando inserir dados sem membership válida ou co `user_id` incorreto.

**Solução:**
1. Verificar se o usuário tem registro em `memberships`
2. Verificar se `user_id` no insert é `auth.uid()`
3. Verificar se `org_id` corresponde à membership do usuário

```sql
-- Verificar membership do usuário
SELECT * FROM memberships WHERE user_id = 'user-uuid';

-- Verificar profile
SELECT * FROM profiles WHERE user_id = 'user-uuid';
```

### Problema: Login redireciona para localhost

**Causa:** URL de redirecionamento não configurada no Supabase.

**Solução:**
1. Supabase Dashboard → Authentication → URL Configuration
2. Adicionar a URL da aplicação em "Site URL"
3. Adicionar URLs de preview/produção em "Redirect URLs"

### Problema: Trigger de signup não cria org

**Causa:** Erro no trigger `on_auth_user_created`.

**Solução:**
```sql
-- Verificar se trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Verificar logs de erro
-- (olhar em Supabase Dashboard → Logs → Auth)
```

### Problema: Drag & drop não persiste ordem

**Causa:** Gap ordering pode precisar de reindex.

**Solução:**
```sql
-- Reindexar coluna específica
SELECT public.reindex_all_task_columns('org-id-aqui');

-- Verificar sort_order das tasks
SELECT id, title, status, sort_order 
FROM tasks 
WHERE org_id = 'org-id' 
ORDER BY status, sort_order;
```

### Problema: Edge function retorna 500

**Causa:** Secrets não configurados ou erro no código.

**Solução:**
1. Verificar logs em Supabase Dashboard → Edge Functions → Logs
2. Verificar se `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão nos secrets
3. Testar localmente co `supabase functions serve`

### Problema: "Could not find the table ... in the schema cache" (PGRST205)

**Causa:** Tabela não existe no banco OU PostgREST precisa recarregar o schema.

**Diagnóstico:**
```sql
-- Verificar se tabela existe
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'nome_da_tabela';
```

**Solução A - Se tabela NÃO existe:**
1. Identificar qual migration cria a tabela (ver checklist acima)
2. Executar a migration no Supabase SQL Editor
3. Verificar que tabela aparece no Table Editor

**Solução B - Se tabela EXISTE mas erro persiste:**
1. Forçar reload do schema cache:
```sql
NOTIFY pgrst, 'reload schema';
```
2. Aguardar ~10 segundos
3. Ou: Supabase Dashboard → Settings → API → "Reload schema"

### Problema: Achievements/Settings não funcionam

**Causa:** Migration 0007 não foi aplicada.

**Verificação:**
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'user_settings'
) as user_settings_exists,
EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'user_achievements'
) as user_achievements_exists;
```

**Solução:**
1. Executar `docs/MIGRATION_0007_user_settings_achievements.sql` no SQL Editor
2. Verificar que tabelas aparecem no Table Editor
3. Recarregar a aplicação

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build de produção
npm run preview          # Preview do build

# Testes
npm run test             # Rodar testes em watch mode
npm run test:run         # Rodar testes uma vez

# Docker
docker-compose up -d     # Subir containers
docker-compose down      # Derrubar containers
docker-compose logs -f   # Ver logs

# Kubernetes
kubectl get pods -l app=vida360
kubectl describe pod <pod-name>
kubectl logs <pod-name> --tail=100
kubectl port-forward svc/vida360 3000:80
```

---

## PWA (Progressive Web App)

### Configuração

O VIDA360 é uma PWA configurada via `vite-plugin-pwa`:

```typescript
// vite.config.ts
VitePWA({
  registerType: "autoUpdate",
  manifest: {
    name: "VIDA360 - Gestão de Vida Pessoal",
    short_name: "VIDA360",
    display: "standalone",
    // ...
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "supabase-api",
          expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
        },
      },
    ],
  },
})
```

### Build e Teste

```bash
# Build de produção (gera SW)
npm run build

# Servir build localmente
npm run preview

# Testar instalação PWA
# 1. Abrir em Chrome
# 2. DevTools → Application → Manifest
# 3. Verificar "Installability"
```

### Service Worker

O SW é gerado automaticamente pelo Workbox co:

- **Precaching**: Arquivos estáticos (JS, CSS, HTML, imagens)
- **Runtime caching**: Requests para Supabase (NetworkFirst)

### Manifest

Arquivos necessários em `public/`:
- `pwa-192x192.png` (ou .svg)
- `pwa-512x512.png` (ou .svg)
- `favicon.ico`

---

## Offline Sync (useOfflineSync)

### Como Funciona

1. **Detecção de conectividade**: `navigator.onLine` + event listeners
2. **Fila local**: Check-ins salvos em `localStorage` quando offline
3. **Replay automático**: Ao voltar online, tenta sincronizar todos
4. **Conflitos**: Último write wins (server-side timestamp)

### Implementação

```typescript
// Hook: src/hooks/useOfflineSync.tsx
const { online, syncing, pendingCount, saveCheckinOffline } = useOfflineSync();

// Storage: src/services/offlineSync.ts
// - getPendingCheckins(): OfflineCheckin[]
// - saveOfflineCheckin(habitId, date, completed)
// - markCheckinSynced(id)
// - clearSyncedCheckins()
```

### Limitações

| Limitação | Razão |
|-----------|-------|
| Apenas check-ins de hábitos | Escopo inicial |
| Sem merge de conflitos | Complexidade |
| LocalStorage (5MB) | Limite do browser |
| Sem background sync | Requer SW custom |

### Testar Offline

1. DevTools → Network → Offline
2. Fazer check-in em um hábito
3. Verificar toast "Salvo offline"
4. DevTools → Network → Online
5. Verificar toast "Sincronizando..."

---

## Push Notifications (Real Web Push)

### Como Funciona

O VIDA360 suporta **push notifications reais** via Web Push API + VAPID:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Edge Function  │────▶│   Push Service  │
│   (Subscribe)   │     │   (send-push)    │     │   (FCM/Mozilla) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│   Service       │     │   Supabase DB    │
│   Worker        │     │   push_subscriptions│
└─────────────────┘     └──────────────────┘
```

### Pré-requisitos

1. **VAPID Keys** geradas e configuradas
2. **Migration 0010** aplicada (tabela `push_subscriptions`)
3. **Edge Function** `send-push` deployada

### Gerar VAPID Keys

```bash
# Usando web-push (Node.js)
npx web-push generate-vapid-keys

# Ou usando https://vapidkeys.com
```

Saída esperada:
```
Public Key: BNxR...base64url...
Private Key: abc123...base64url...
```

### Onde Configurar

| Secret | Onde | Uso |
|--------|------|-----|
| `VAPID_PUBLIC_KEY` | Supabase Secrets | Edge Function |
| `VAPID_PRIVATE_KEY` | Supabase Secrets | Edge Function (NÃO expor!) |
| `VITE_VAPID_PUBLIC_KEY` | Lovable Secrets | Frontend (subscribe) |

**IMPORTANTE**: `VITE_VAPID_PUBLIC_KEY` deve ter o mesmo valor de `VAPID_PUBLIC_KEY`.

### Ativar Push (Usuário)

1. Ir em Configurações → Notificações em Segundo Plano
2. Clicar em "Ativar"
3. Aceitar permissão do navegador
4. Subscription salva em `push_subscriptions`

### Enviar Push (Servidor)

```typescript
// Via supabase.functions.invoke
await supabase.functions.invoke('send-push', {
  body: {
    user_id: 'uuid',
    title: 'Título',
    message: 'Corpo da mensagem',
    url: '/app/home'
  }
});
```

### Testar Push

1. Ativar push nas Configurações
2. Clicar "Enviar Notificação de Teste"
3. Verificar que notificação chegou (mesmo co aba fechada)

### Troubleshooting Push

| Problema | Causa Provável | Solução |
|----------|---------------|---------|
| "VAPID keys not configured" | Secrets ausentes | Adicionar VAPID_* nos Secrets |
| 401/403 no endpoint | VAPID signature inválida | Verificar formato das keys |
| Subscription não salva | RLS ou org_id errado | Verificar policies |
| Push não chega | SW não registrado | Verificar DevTools → Application → SW |

### Desativar Push (Feature Flag)

Para desativar push temporariamente sem deploy:

1. Remover `VAPID_PUBLIC_KEY` dos Supabase Secrets
2. Edge function retornará erro e frontend não tentará enviar

---

## Beta Public Launch Checklist

### Pré-Launch (Obrigatório)

- [ ] **Migrations reconciliadas**: `ls docs/MIGRATION_*.sql | wc -l` matches `SELECT COUNT(*) FROM schema_migrations`
- [ ] **RLS verificado** em todas as tabelas
- [ ] **Env vars configuradas** (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] **Build sem erros**: `npm run build`
- [ ] **Testes passando**: `npm run test:run`
- [ ] **E2E passando**: `npx playwright test`

### Push Notifications (Opcional)

- [ ] VAPID keys geradas
- [ ] VAPID_PUBLIC_KEY no Supabase Secrets
- [ ] VAPID_PRIVATE_KEY no Supabase Secrets
- [ ] VITE_VAPID_PUBLIC_KEY no Lovable Secrets
- [ ] Edge function send-push deployada
- [ ] Teste de push funcionando

### Segurança

- [ ] Nenhuma chave hardcoded no código
- [ ] RLS habilitado em TODAS as tabelas
- [ ] Storage policies configuradas
- [ ] Sem service_role key no frontend

### Monitoramento

- [ ] Health check endpoint funcionando (`/functions/v1/health`)
- [ ] Logs do Supabase acessíveis
- [ ] Alertas configurados (opcional)

### Rollback Plan

Se algo der errado após launch:

1. **Push quebrado**: Remover VAPID keys dos Secrets → desativa push
2. **Auth quebrado**: Verificar trigger `on_auth_user_created`
3. **Data loss**: Restaurar backup do Supabase (Dashboard → Database → Backups)
4. **Código quebrado**: Reverter para commit anterior no Lovable

### Comandos de Verificação

```bash
# Build
npm run build

# Testes unitários
npm run test:run

# Testes E2E
npx playwright test

# TypeScript check
npm run typecheck

# Lint
npm run lint
```

### Queries de Verificação (SQL)

```sql
-- Verificar migrations aplicadas
SELECT filename, applied_at FROM schema_migrations ORDER BY applied_at;

-- Verificar RLS habilitado
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- Verificar policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Verificar push subscriptions
SELECT COUNT(*) as total_subscriptions FROM push_subscriptions;
```

---

## Observabilidade (Sprint 3.5)

### Sentry (Frontend Error Tracking)

#### Configuração

| Variável | Descrição | Onde Configurar |
|----------|-----------|-----------------|
| `VITE_SENTRY_DSN` | DSN do projeto Sentry | Lovable Secrets |
| `VITE_APP_VERSION` | Versão do app (opcional) | Lovable Secrets |

**Nota:** Se `VITE_SENTRY_DSN` não estiver configurado, Sentry será desabilitado automaticamente (sem erros).

#### Funcionalidades

- Captura automática de exceptions e unhandled rejections
- User context (user_id, org_id) quando autenticado
- Route tagging para debugging
- Breadcrumbs de navegação

#### Verificar Status

No console do navegador:
```javascript
// Verificar se Sentry está ativo
import { getSentryStatus } from '@/lib/observability/sentry';
getSentryStatus(); // { enabled: true/false, dsn: true/false, ... }
```

### Bug Reports

#### Tabela: bug_reports

Permite usuários reportarem problemas diretamente pelo app.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | ID único |
| `org_id` | uuid | Organização |
| `user_id` | uuid | Autor do report |
| `title` | text | Título do bug |
| `description` | text | Descrição detalhada |
| `steps` | text | Passos para reproduzir |
| `expected` | text | Comportamento esperado |
| `actual` | text | Comportamento atual |
| `meta` | jsonb | Diagnóstico automático |
| `created_at` | timestamptz | Data de criação |

#### Meta (Diagnóstico Automático)

```json
{
  "app_version": "3.5.0",
  "route": "/app/finance",
  "user_agent": "Mozilla/5.0...",
  "timezone": "America/Sao_Paulo",
  "online": true,
  "build": "production"
}
```

#### RLS

- **INSERT**: Apenas usuários autenticados da org
- **SELECT**: Autor do report OU admin/owner da org
- **UPDATE/DELETE**: Negado (reports são imutáveis)

### Push Rate Limiting

#### Tabela: push_rate_limits

Previne abuso do endpoint de push notifications.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `user_id` | uuid | ID do usuário |
| `org_id` | uuid | Organização |
| `window_start` | timestamptz | Início da janela |
| `count` | int | Requisições na janela |

#### Configuração

| Constante | Valor | Descrição |
|-----------|-------|-----------|
| `MAX_REQUESTS` | 30 | Máximo por janela |
| `WINDOW_MINUTES` | 10 | Duração da janela (minutos) |

#### Comportamento

1. Edge function `send-push` verifica limite antes de enviar
2. Se exceder, retorna `429 Too Many Requests`:
```json
{
  "error": "rate_limited",
  "retryAfterSeconds": 600
}
```
3. Frontend mostra toast amigável
4. Limpeza automática de registros antigos via trigger

#### Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| 429 Rate Limited | Muitas requisições | Aguardar janela expirar |
| Push test falhando | Rate limit atingido | Verificar `push_rate_limits` |

```sql
-- Verificar rate limits de um usuário
SELECT * FROM push_rate_limits 
WHERE user_id = 'user-uuid' 
ORDER BY window_start DESC LIMIT 5;

-- Resetar rate limit (admin)
DELETE FROM push_rate_limits WHERE user_id = 'user-uuid';
```

---

## Public Beta Launch Steps

Checklist para lançamento do Public Beta:

### 1. Configurar Env Vars em PROD

1. Lovable → Project Settings → Cloud → Secrets
2. Adicionar:
   - `VITE_SUPABASE_URL` (obrigatória)
   - `VITE_SUPABASE_ANON_KEY` (obrigatória)
   - `VITE_VAPID_PUBLIC_KEY` (opcional - push)
   - `VITE_SENTRY_DSN` (opcional - error tracking)
   - `VITE_APP_VERSION` = `3.5.5-beta`

### 2. Verificar CI Green

Confirmar que todos os gates passaram no último push:

- [ ] TypeCheck: `npm run typecheck`
- [ ] Unit Tests: `npm run test:run`
- [ ] Build: `npm run build`
- [ ] E2E: `npm run e2e`

### 3. Executar Smoke Checklist

Ver `docs/BETA_SMOKE_CHECKLIST.md`:

- [ ] Auth (login/logout)
- [ ] Goals CRUD
- [ ] Habits check-in
- [ ] Tasks kanban
- [ ] Finance transactions
- [ ] Bug reports
- [ ] RLS sanity

### 4. Publicar

1. Lovable → Publish
2. Verificar URL de produção
3. Testar login na URL final

### 5. Monitorar

- **Edge Functions Logs**: Supabase Dashboard → Edge Functions → Logs
- **Sentry** (se configurado): Dashboard de erros
- **Bug Reports**: `SELECT * FROM bug_reports ORDER BY created_at DESC LIMIT 10;`

### Rollback Rápido

Se problemas críticos:

1. Lovable → Deploy History → Restore versão anterior
2. Ou remover secret problemático (ex: VAPID) → Republish

---

## Contatos

- **Documentação Lovable:** https://docs.lovable.dev
- **Supabase Docs:** https://supabase.com/docs
- **Issues:** Reportar no repositório do projeto
