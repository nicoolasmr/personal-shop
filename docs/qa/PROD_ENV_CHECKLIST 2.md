# VIDA360 — Production Environment Checklist

**Data:** 2025-12-29  
**Versão:** 3.5.5-beta  
**Status:** ✅ READY FOR PUBLIC BETA

---

## 1. Variáveis de Ambiente

### ✅ REQUIRED (Build falha se ausentes em PROD)

| Variável | Tipo | Onde Configurar | Validação |
|----------|------|-----------------|-----------|
| `VITE_SUPABASE_URL` | URL | Lovable: Settings → Cloud → Secrets | Deve ser `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | String | Lovable: Settings → Cloud → Secrets | JWT começando com `eyJ` |

### ⚡ OPTIONAL (App funciona sem, features degradam gracefully)

| Variável | Tipo | Default | Efeito se Ausente |
|----------|------|---------|-------------------|
| `VITE_VAPID_PUBLIC_KEY` | String | `null` | Push notifications desabilitadas |
| `VITE_SENTRY_DSN` | URL | `null` | Error tracking local apenas (console) |
| `VITE_APP_VERSION` | String | `"dev"` | Versão genérica exibida |

---

## 2. Onde Configurar no Lovable

1. Abra seu projeto no Lovable
2. Vá em **Project Settings** (ícone de engrenagem)
3. Navegue para **Cloud → Secrets**
4. Adicione cada variável:
   - Nome: `VITE_SUPABASE_URL`
   - Valor: copie do Supabase Dashboard → Settings → API → Project URL
5. Repita para `VITE_SUPABASE_ANON_KEY`
6. Clique **Publish** para aplicar

---

## 3. Como Validar

### 3.1 Build Local (Simula PROD)

```bash
# Limpar e buildar
rm -rf node_modules dist
npm ci
npm run build

# Se build suceder, env vars estão ok
# Se falhar com "VITE_SUPABASE_URL is required", configure as vars
```

### 3.2 Verificar no App (Console do Browser)

Após publicar, abra o app em produção e verifique no Console:

```
✅ Esperado (tudo ok):
[Sentry] DSN not configured - error tracking disabled
# Nenhum erro de "REQUIRED environment variable missing"

❌ Problema (faltam vars):
FATAL: REQUIRED environment variable missing: VITE_SUPABASE_URL
```

### 3.3 Verificar Edge Function Health

```bash
curl https://SEU-PROJETO.supabase.co/functions/v1/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "service": "vida360",
  "supabase": {
    "configured": true,
    "connected": true
  }
}
```

---

## 4. Sintomas de Configuração Incorreta

| Sintoma | Causa Provável | Solução |
|---------|---------------|---------|
| Tela "Setup Required" | `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` ausentes | Configurar no Lovable Secrets |
| Build falha com "REQUIRED missing" | Vars não configuradas no CI/Hosting | Adicionar secrets no GitHub/Lovable |
| `401 Unauthorized` em API calls | `VITE_SUPABASE_ANON_KEY` inválida ou expirada | Gerar nova key no Supabase |
| Push não funciona (silencioso) | `VITE_VAPID_PUBLIC_KEY` não configurada | Configurar VAPID (ver PUSH_VALIDATION.md) |
| Erros não aparecem no Sentry | `VITE_SENTRY_DSN` não configurada | Configurar DSN do Sentry |

---

## 5. Comportamento DEV vs PROD

| Aspecto | DEV (`npm run dev`) | PROD (`npm run build`) |
|---------|---------------------|------------------------|
| Vars obrigatórias ausentes | ⚠️ Warning + fallback | ❌ Build FALHA |
| Fallback Supabase URL | Usa URL de dev | NÃO usa fallback |
| Console spam | Permitido (debug) | Mínimo (errors only) |

---

## 6. Checklist Pre-Publish

- [ ] `VITE_SUPABASE_URL` configurada no Lovable Secrets
- [ ] `VITE_SUPABASE_ANON_KEY` configurada no Lovable Secrets
- [ ] Build local passa (`npm run build`)
- [ ] App abre sem "Setup Required"
- [ ] Login funciona
- [ ] Dados carregam corretamente

---

## 7. Rollback Rápido

Se algo der errado após publicar:

1. **Lovable**: Clique em "Previous version" no histórico de deploys
2. **Verificar logs**: Console do browser ou Supabase Edge Function Logs
3. **Desabilitar features**: Remover VAPID key desabilita push sem quebrar app

---

*Documento gerado para VIDA360 Sprint 3.5.5 - Public Beta*
