# VIDA360 — Smoke Tests for Public Beta

**Data:** 2025-12-29  
**Sprint:** 3.5.5  
**Objetivo:** Validação rápida de features críticas antes do launch

---

## 1. Observability Smoke Tests

### 1.1 Sentry (Error Tracking)

**Comportamento Esperado:**
- Se `VITE_SENTRY_DSN` configurado → erros enviados ao Sentry
- Se `VITE_SENTRY_DSN` ausente → fallback silencioso para console.log

**Validação (Console do Browser):**
```
// Esperado quando DSN não configurado:
[Sentry] DSN not configured - error tracking disabled

// Esperado quando DSN configurado:
[Sentry] Initialized - env: production, release: 3.5.5-beta
```

**Smoke Test:**
1. Abra o app em produção
2. Abra DevTools → Console
3. Verifique que NÃO há spam de errors relacionados a Sentry
4. Confirme mensagem de status única no load

**Resultado:** ✅ PASS se console limpo (apenas 1 log de Sentry)

---

### 1.2 Bug Reports

**Validação Manual:**

1. **Abrir modal:**
   - Vá em Settings (ícone engrenagem)
   - Clique em "Reportar Problema" ou "Bug Report"

2. **Enviar report:**
   - Preencha título: "Smoke Test Beta"
   - Preencha descrição: "Teste de validação pre-launch"
   - Clique "Enviar"

3. **Confirmar no banco:**
```sql
SELECT id, title, description, status, created_at,
       meta->>'url' as page_url,
       meta->>'userAgent' as browser
FROM bug_reports
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado Esperado:**
- Toast de sucesso "Bug reportado"
- Registro visível no banco com `meta` preenchido

**Resultado:** ✅ PASS se registro aparecer em < 5 segundos

---

### 1.3 Rate Limiting (Push)

**Validação (se push habilitado):**

```sql
-- Verificar tabela de rate limits
SELECT user_id, push_count, window_start
FROM push_rate_limits
WHERE window_start > NOW() - INTERVAL '1 hour';
```

**Resultado:** ✅ PASS se tabela existe e rate limits estão funcionando

---

## 2. Core Features Smoke Tests

### 2.1 Authentication

| Teste | Passos | Resultado Esperado |
|-------|--------|-------------------|
| Login | Email + senha válidos | Redireciona para /app/home |
| Logout | Clicar em Logout | Redireciona para / ou /login |
| Signup | Novo email + senha | Conta criada, login automático |

### 2.2 Data Operations

| Teste | Passos | Resultado Esperado |
|-------|--------|-------------------|
| Create Goal | Goals → New Goal → salvar | Goal aparece na lista |
| Check-in Habit | Habits → marcar dia | Check-in registrado |
| Create Task | Tasks → Add Task → salvar | Task no kanban |
| Create Transaction | Finance → New → salvar | Transação na lista |

---

## 3. RLS Sanity Check

**Objetivo:** Garantir que usuário A não vê dados do usuário B.

**Teste Manual:**
1. Crie 2 contas de teste (email1@test.com, email2@test.com)
2. Com user1: crie 1 goal, 1 habit, 1 task
3. Logout e login com user2
4. Verifique que user2 NÃO vê os dados do user1

**Validação SQL (admin):**
```sql
-- Verificar isolamento de dados
SELECT 
  (SELECT COUNT(*) FROM goals WHERE org_id = 'ORG_A') as goals_org_a,
  (SELECT COUNT(*) FROM goals WHERE org_id = 'ORG_B') as goals_org_b;

-- Cada org deve ter seus próprios dados
```

**Resultado:** ✅ PASS se dados completamente isolados

---

## 4. Quick Checklist

```
□ App abre sem erros no console
□ Login funciona
□ Logout funciona
□ Goals CRUD ok
□ Habits check-in ok
□ Tasks CRUD ok
□ Finance CRUD ok
□ Bug report envia e aparece no DB
□ RLS isolamento verificado
□ Sentry fallback silencioso (se não configurado)
```

---

## 5. Resultado Final

| Área | Status | Notas |
|------|--------|-------|
| Auth | ⏳ | |
| Goals | ⏳ | |
| Habits | ⏳ | |
| Tasks | ⏳ | |
| Finance | ⏳ | |
| Bug Reports | ⏳ | |
| RLS | ⏳ | |
| Observability | ⏳ | |

**Data do Teste:** _______________  
**Testador:** _______________  
**Versão:** 3.5.5-beta

---

*Documento gerado para VIDA360 Sprint 3.5.5 - Public Beta*
