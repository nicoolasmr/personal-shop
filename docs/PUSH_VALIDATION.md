# VIDA360 — Push Notifications Validation Guide

**Data:** 2025-12-29  
**Sprint:** 3.5.5  
**Status:** ⚡ OPCIONAL para Beta (app funciona sem push)

---

## 1. Visão Geral

Push Notifications no VIDA360 usam:
- **Web Push API** (browser standard)
- **VAPID** (Voluntary Application Server Identification)
- **Supabase Edge Function** (`send-push`) para envio server-side

---

## 2. Pré-requisitos

### 2.1 Migrations Necessárias

```sql
-- Verificar se tabelas existem
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('push_subscriptions', 'push_rate_limits');
```

Se não existirem, aplicar:
- `docs/MIGRATION_0010_push_subscriptions.sql`
- `docs/MIGRATION_0018_push_rate_limit.sql`

### 2.2 Gerar VAPID Keys

```bash
# Usando web-push CLI
npx web-push generate-vapid-keys

# Output esperado:
# Public Key: BNxxxx...
# Private Key: xxxxx...
```

Guarde ambas as chaves em local seguro.

---

## 3. Configuração

### 3.1 Frontend (Lovable)

| Variável | Onde | Valor |
|----------|------|-------|
| `VITE_VAPID_PUBLIC_KEY` | Lovable Settings → Cloud → Secrets | `BNxxxx...` (chave pública) |

### 3.2 Backend (Supabase Edge Function)

| Secret | Onde | Valor |
|--------|------|-------|
| `VAPID_PUBLIC_KEY` | Supabase Dashboard → Edge Functions → Secrets | `BNxxxx...` |
| `VAPID_PRIVATE_KEY` | Supabase Dashboard → Edge Functions → Secrets | Chave privada |

**IMPORTANTE**: Nunca commitar chaves privadas no código.

---

## 4. Fluxo de Validação

### 4.1 Ativar Push no App

1. Faça login no VIDA360
2. Vá em **Settings → Notificações**
3. Clique em **Ativar Notificações Push**
4. Aceite o prompt do browser "Permitir notificações"

### 4.2 Verificar Subscription no Banco

```sql
-- Deve retornar 1+ registros para seu user
SELECT id, user_id, created_at, 
       LEFT(endpoint, 50) as endpoint_prefix
FROM push_subscriptions
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### 4.3 Enviar Test Push

```bash
# Via Edge Function (requer auth token)
curl -X POST \
  'https://SEU-PROJETO.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer SEU_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "SEU_USER_ID",
    "title": "Test Push",
    "body": "Se você vê isso, push funciona!",
    "url": "/app/home"
  }'
```

### 4.4 Verificar Logs da Edge Function

Supabase Dashboard → Edge Functions → `send-push` → Logs

Logs esperados (sucesso):
```
[send-push] Request received for user: xxx
[send-push] Found 1 subscriptions
[send-push] Sent successfully to 1 endpoints
```

Logs de erro comum:
```
[send-push] VAPID keys not configured
[send-push] Rate limit exceeded for user: xxx
```

---

## 5. Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| Botão "Ativar Push" não aparece | VAPID_PUBLIC_KEY não configurada | Adicionar `VITE_VAPID_PUBLIC_KEY` no Lovable |
| "Permission denied" | Usuário bloqueou notificações | Resetar permissões no browser |
| Push não chega | VAPID_PRIVATE_KEY incorreta | Verificar secrets na Edge Function |
| "Rate limit exceeded" | Mais de 10 push/hora para user | Aguardar 1 hora ou ajustar limite |
| Subscription não persiste | Migration 0010 não aplicada | Aplicar `MIGRATION_0010_push_subscriptions.sql` |

---

## 6. Desabilitar Push (Temporarily)

Se push estiver causando problemas:

1. Remova `VITE_VAPID_PUBLIC_KEY` do Lovable Secrets
2. Republique o app
3. O botão "Ativar Push" desaparecerá (graceful degradation)

O app continuará funcionando normalmente sem push.

---

## 7. Checklist de Validação

- [ ] VAPID keys geradas (pública e privada)
- [ ] `VITE_VAPID_PUBLIC_KEY` configurada no Lovable
- [ ] `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` nos Supabase Secrets
- [ ] Migrations 0010 e 0018 aplicadas
- [ ] Botão "Ativar Push" visível em Settings
- [ ] Subscription criada no banco após ativar
- [ ] Test push recebido no browser

---

*Documento gerado para VIDA360 Sprint 3.5.5 - Public Beta*
