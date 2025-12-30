# Release Notes - VIDA360 v3.5.7-beta

**Data:** 2025-12-29
**Tipo:** Security Hotfix

## 🛡️ Segurança (Harding)

Esta versão foca exclusivamente na correção de vulnerabilidades de segurança na Edge Function de notificações push e no refinamento de políticas de acesso.

### 1. Autorização em `send-push`
Corrigida vulnerabilidade `send_push_no_auth` que permitia que usuários autenticados enviassem notificações para qualquer `user_id` do sistema.

### 1. Hardened Authorization Matrix
A Edge Function agora valida explicitamente a permissão de envio baseada na relação entre o chamador e o destinatário:
- **Self-push**: Permitido.
- **Same-org push**: Permitido apenas para roles `admin` ou `owner`.
- **Cross-org push**: Bloqueado com `403 Forbidden`.
- **Audit Log**: Todas as tentativas bloqueadas (403) são registradas na tabela `audit_log` para monitoramento de abuso.

### 2. URL Sanitization
Bloqueio de protocolos inseguros (`http:`, `javascript:`, `data:`) e caminhos mal formados. Somente caminhos relativos ou `https:` são permitidos.

### 3. Privacy-First Logging
Logs estruturados que removem qualquer PII (Personal Identifiable Information). Não logamos mais tokens, endpoints de push ou conteúdo das mensagens.

## 🧪 Como Validar

Para um guia completo de validação manual via `curl`, consulte:
👉 [QA_PUSH_SECURITY_3_5_7.md](./qa/QA_PUSH_SECURITY_3_5_7.md)

### Resumo rápido:
```bash
# Deve retornar 403 (Cross-org)
curl -X POST https://xxx.supabase.co/functions/v1/send-push \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"org_id": "OUTRA_ORG_ID", "title": "Spam", "body": "Spam"}'
```

---
**Nota:** Não houve migrações de banco de dados nesta versão.
