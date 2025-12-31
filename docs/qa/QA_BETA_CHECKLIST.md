# VIDA360 QA Beta Checklist

## Índice

1. [Smoke Tests Manuais](#smoke-tests-manuais)
2. [Comandos de Teste](#comandos-de-teste)
3. [RLS Regression Checks](#rls-regression-checks)
4. [Observability Checks](#observability-checks)
5. [Beta Features Checklist](#beta-features-checklist)

---

## Smoke Tests Manuais

### Autenticação
- [ ] Login com email/senha funciona
- [ ] Signup cria nova conta
- [ ] Logout redireciona para /login
- [ ] Rotas /app/* protegidas (redirect se não logado)
- [ ] Refresh token renova sessão

### Home Dashboard
- [ ] Cards de resumo carregam
- [ ] Tarefas do dia aparecem
- [ ] Hábitos do dia aparecem
- [ ] Metas ativas visíveis
- [ ] Navegação pelo sidebar funciona

### Hábitos
- [ ] Listar hábitos funciona
- [ ] Criar hábito novo
- [ ] Editar hábito existente
- [ ] Deletar hábito
- [ ] Check-in de hábito (hoje)
- [ ] Streak atualiza corretamente

### Tarefas
- [ ] Kanban carrega colunas
- [ ] Criar tarefa nova
- [ ] Editar tarefa
- [ ] Mover tarefa entre colunas (drag & drop)
- [ ] Deletar tarefa
- [ ] Subtarefas funcionam

### Metas (Goals)
- [ ] Listar metas ativas
- [ ] Criar meta nova
- [ ] Adicionar progresso
- [ ] Completar meta
- [ ] Arquivar meta
- [ ] Sync com hábitos (se tipo habit)

### Finanças
- [ ] Listar transações
- [ ] Criar transação (receita)
- [ ] Criar transação (despesa)
- [ ] Editar transação
- [ ] Deletar transação
- [ ] Resumo mensal correto
- [ ] Parcelamentos funcionam
- [ ] Metas financeiras sincronizam

### Configurações
- [ ] Alternar tema (claro/escuro)
- [ ] Notificações in-app
- [ ] Push notifications (se VAPID configurado)
- [ ] Bug report modal abre e envia

### PWA
- [ ] App pode ser instalado
- [ ] Funciona offline (leitura)
- [ ] Service worker registra

---

## Comandos de Teste

```bash
# TypeScript check
npm run typecheck

# Unit tests
npm run test:run

# E2E tests (Playwright)
npx playwright test

# E2E com UI
npx playwright test --ui

# Build de produção
npm run build

# Run all gates
npm run typecheck && npm run test:run && npx playwright test && npm run build
```

### Verificar cobertura de testes

```bash
# Vitest com coverage
npx vitest run --coverage

# Ver relatório
open coverage/index.html
```

---

## RLS Regression Checks

Execute no **Supabase SQL Editor** para verificar segurança:

### 1. Verificar RLS Habilitado

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'orgs', 'profiles', 'memberships', 'user_roles', 'audit_log',
    'habits', 'habit_checkins', 'tasks', 'task_subtasks', 'task_attachments',
    'goals', 'goal_progress', 'user_settings', 'user_achievements',
    'transactions', 'transaction_categories', 'finance_goals',
    'push_subscriptions', 'bug_reports', 'push_rate_limits'
  )
ORDER BY tablename;
```

**Esperado:** Todas as linhas com `rls_enabled = true`

### 2. Listar Policies por Tabela

```sql
SELECT 
  tablename,
  policyname,
  permissive,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 3. Verificar que Usuário NÃO Pode Inserir Admin

```sql
-- TESTE: Tentar inserir role admin via client
-- Este comando DEVE FALHAR com erro de RLS se policies estão corretas
-- Execute como um usuário autenticado (não service role)

-- Primeiro, ver estrutura da tabela user_roles
SELECT column_name, data_type, udt_name
FROM information_schema.columns 
WHERE table_name = 'user_roles' AND table_schema = 'public';

-- Tentar insert (deve falhar por RLS)
-- NOTA: Substitua pelos valores reais das colunas
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES (auth.uid(), 'admin'::public.app_role);
```

**Esperado:** Erro `new row violates row-level security policy`

### 4. Verificar Tabelas de Migrations

```sql
SELECT filename, applied_at, notes 
FROM public.schema_migrations 
ORDER BY applied_at DESC
LIMIT 25;
```

### 5. Verificar Storage Buckets

```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id IN ('avatars', 'task-attachments');
```

### 6. Verificar Triggers

```sql
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname IN (
  'on_auth_user_created',
  'update_goals_from_progress',
  'transactions_sync_goals',
  'habit_checkin_goal_sync'
);
```

---

## Observability Checks
 
### Sentry

1. **Verificar inicialização:**
   - Console deve mostrar `[Observability] Sentry initialized in <env> mode.` quando `VITE_SENTRY_DSN` estiver configurado
   - Em produção, se DSN estiver ausente, console deve registrar warning único: `[Observability] Sentry DSN not found in production. Error tracking is disabled.`

2. **Testar captura de erro:**
   ```javascript
   // No console do navegador
   throw new Error('Test Sentry capture');
   ```

3. **Verificar contexto de usuário:**
   - Após login, console deve mostrar `[Sentry] User context set: <user-id>`

### Bug Reports

1. **Testar criação:**
   - Ir em Settings
   - Clicar "Reportar Problema"
   - Preencher formulário
   - Enviar
   - Verificar toast de sucesso

2. **Verificar no banco:**
   ```sql
   SELECT id, title, meta, created_at 
   FROM public.bug_reports 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

### Push Rate Limit

1. **Testar limite:**
   - Configurar VAPID keys
   - Ativar push notifications
   - Enviar 31+ notificações de teste em 10 min
   - Deve retornar erro 429

2. **Verificar no banco:**
   ```sql
   SELECT * FROM public.push_rate_limits;
   SELECT * FROM public.check_push_rate_limit('user-id', 'org-id');
   ```

---

## Beta Features Checklist

### Sprint 3.5 Específico

- [ ] **Sentry Integration**
  - [ ] VITE_SENTRY_DSN configurável
  - [ ] Captura erros não tratados
  - [ ] Contexto de usuário após login
  - [ ] Graceful quando DSN vazio

- [ ] **Bug Report**
  - [ ] Modal acessível em Settings
  - [ ] Campos obrigatórios validados
  - [ ] Metadados coletados automaticamente
  - [ ] Copiar diagnóstico funciona
  - [ ] Insert funciona (RLS)
  - [ ] Usuário só vê próprios reports

- [ ] **Push Rate Limit**
  - [ ] Tabela push_rate_limits existe
  - [ ] Function check_push_rate_limit funciona
  - [ ] Edge function usa rate limit
  - [ ] Retorna 429 quando excede
  - [ ] UI mostra erro amigável

- [ ] **E2E Finance**
  - [ ] Testes básicos passam
  - [ ] Placeholder para testes autenticados

---

## Gates de Aceite

Antes de considerar Sprint 3.5 completo:

```bash
# TODOS devem passar
npm run typecheck       # 0 errors
npm run test:run        # all pass
npx playwright test     # all pass
npm run build           # success
```

Verificar manualmente:
- [ ] App sobe sem DSN Sentry (sem crash)
- [ ] App sobe com DSN Sentry
- [ ] Bug report insere no banco
- [ ] RLS bloqueia leitura de reports de outros usuários
- [ ] Push rate limit retorna 429 quando excedido
