# QA - Verificação de Segurança Push (v3.5.7)

Este documento descreve como validar manualmente as proteções de segurança da Edge Function `send-push`.

## 🛡️ Pré-requisitos

1. **URL da Função**: `https://<PROJECT_REF>.supabase.co/functions/v1/send-push`
2. **JWT do Usuário**:
   - Abra o app no navegador.
   - DevTools (F12) -> Application -> Local Storage.
   - Procure a chave `sb-<ID>-auth-token`.
   - Copie o valor de `access_token`.
   - ⚠️ **AVISO**: Nunca compartilhe este token. Ele expira em 1 hora.

## 🧪 Casos de Teste (curl)

Substitua `<URL>` pela URL da sua função e `<JWT>` pelo token copiado.

### 1. Self Push (Sucesso esperado)
O usuário deve conseguir enviar push para si mesmo.
```bash
curl -i -X POST <URL> \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "SEU_PROPRIO_USER_ID",
    "title": "Teste Manual",
    "body": "Se você recebeu isso, o self-push está ok!"
  }'
```
**Esperado:** `200 OK` com `{ "ok": true, ... }`

### 2. URL Maliciosa (Bloqueio esperado)
Bloqueio de esquemas perigosos.
```bash
curl -i -X POST <URL> \
  -H "Authorization: Bearer <JWT>" \
  -d '{
    "user_id": "SEU_PROPRIO_USER_ID",
    "title": "Aviso",
    "body": "Clique aqui",
    "url": "javascript:alert(1)"
  }'
```
**Esperado:** `400 Bad Request` com `{ "ok": false, "error": "invalid_payload", "details": "blocked_url_scheme" }`

### 3. Cross-Org (Bloqueio esperado)
Tentar enviar para uma organização que não é a sua.
```bash
curl -i -X POST <URL> \
  -H "Authorization: Bearer <JWT>" \
  -d '{
    "org_id": "UUID_DE_OUTRA_ORGANIZACAO",
    "title": "Invasão",
    "body": "Spam cross-org"
  }'
```
**Esperado:** `403 Forbidden` com `{ "ok": false, "error": "forbidden", "details": "cross_org" }`

### 4. Same-Org / Outro Usuário (Member -> Admin)
Um usuário comum tentando enviar push para outro usuário na mesma org (sem ser admin).
```bash
curl -i -X POST <URL> \
  -H "Authorization: Bearer <JWT_MEMBER>" \
  -d '{
    "user_id": "USER_ID_DE_OUTRA_PESSOA_NA_ORG",
    "title": "Shhh",
    "body": "Tentativa não autorizada"
  }'
```
**Esperado:** `403 Forbidden` com `{ "ok": false, "error": "forbidden", "details": "not_privileged" }`

### 5. Same-Org / Outro Usuário (Admin -> Member)
Um admin enviando push para um subordinado.
```bash
curl -i -X POST <URL> \
  -H "Authorization: Bearer <JWT_ADMIN>" \
  -d '{
    "user_id": "USER_ID_DO_SUBORDINADO",
    "title": "Aviso da Firma",
    "body": "Reunião em 5 minutos"
  }'
```
**Esperado:** `200 OK` (se existirem inscrições) ou `200 OK` com `sent: 0` (se o alvo não tiver PWA instalado).

### 6. Rate Limit (Bloqueio esperado)
Disparar a mesma requisição repetidamente (ex: 10x em 1 segundo).
**Esperado:** `429 Too Many Requests` com `{ "ok": false, "error": "rate_limited" }` after X attempts.

## 📊 Evidências e Logs

- **Audit Log**: Verifique a tabela `public.audit_log`. Tentativas bloqueadas (403) devem aparecer com `action = 'push_forbidden'`.
- **Privacy Check**: Verifique os logs no dashboard do Supabase. Garanta que **NÃO** aparecem:
  - Endpoints de notificação
  - Tokens base64
  - Títulos/Corpos das mensagens reais
