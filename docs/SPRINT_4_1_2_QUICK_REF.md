# Sprint 4.1.2 - Quick Reference

## 📁 Arquivos Modificados

```
apps/web/src/
├── lib/
│   └── safe-query.ts                                    🔧 ALTERADO
├── app/
│   ├── api/
│   │   ├── home/route.ts                                🔧 ALTERADO
│   │   └── purchases/confirmations/[token]/snooze/
│   │       └── route.ts                                 ✨ NOVO
│   └── app/
│       └── page.tsx                                     🔧 ALTERADO
└── server/purchases/
    └── attribution-service.ts                           🔧 ALTERADO

docs/
└── RELATORIO_SPRINT_4_1_2.md                            ✨ NOVO
```

---

## 🎯 Principais Mudanças

### 1. Chaves Canônicas
- ❌ **Antes:** `partial_failures: ["notifications", "economy"]`
- ✅ **Depois:** `partial_failures: ["notifications_unread", "economy_7d"]`

### 2. Snooze (72h)
- ❌ **Antes:** Só dismiss (permanente)
- ✅ **Depois:** Dismiss + Snooze 72h

### 3. Recommended Template
- ❌ **Antes:** Sem `score` e `moment_of_life_match`
- ✅ **Depois:** Shape completo

### 4. UI Confirmações
- ❌ **Antes:** 2 botões (Confirmar / Dispensar)
- ✅ **Depois:** 3 botões (Confirmar / Snooze / Dispensar)

---

## 🔑 Chaves Canônicas

| Chave Interna | Chave Canônica |
|---------------|----------------|
| `userProfile` | `user_profile` |
| `pendingConfirmations` | `pending_confirmations` |
| `activeMission` | `mission_active` |
| `alerts` | `alerts_count` |
| `economy` | `economy_7d` |
| `notifications` | `notifications_unread` |
| `recentTriggers` | `alerts_recent_triggers` |
| `templates` | `mission_templates` |
| `activity` | `activity_feed` |

---

## 🛡️ Gate de Confirmações (Atualizado)

**Condições para mostrar:**
1. ✅ Clique < 7 dias
2. ✅ Não confirmado
3. ✅ Não dispensado (`dismissed_at IS NULL`)
4. ✅ **Snooze expirado ou nunca snoozed** (`snoozed_until < NOW()`)
5. ✅ Cooldown expirado (`last_prompted_at < NOW() - 24h`)

**Campos no meta:**
```json
{
  "dismissed_at": "2026-01-10T10:00:00Z",      // Permanente
  "snoozed_until": "2026-01-13T10:00:00Z",     // 72h
  "last_prompted_at": "2026-01-10T10:00:00Z"   // 24h cooldown
}
```

---

## 📊 Novos Eventos de Tracking

| Evento | Onde | Payload |
|--------|------|---------|
| `home_confirmation_snoozed` | Server | `{ token, hours: 72 }` |

---

## 🔍 Response Schema (Mudanças)

```diff
{
  "meta": {
-   "partial_failures": ["notifications", "economy"]
+   "partial_failures": ["notifications_unread", "economy_7d"]
  },
  "mission": {
    "recommended_template": {
      "key": "home_office",
      "title": "Monte seu Home Office",
      "priority_reason": "...",
      "href": "/app/missions?preselect=home_office",
+     "score": 100,
+     "moment_of_life_match": true
    }
  }
}
```

---

## 🧪 Como Testar

### Chaves Canônicas
```bash
curl http://localhost:3000/api/home | jq '.meta.partial_failures'
# Esperado: ["notifications_unread", "alerts_recent_triggers"]
```

### Snooze
```bash
curl -X POST http://localhost:3000/api/purchases/confirmations/test_token/snooze \
  -H "Content-Type: application/json" \
  -d '{"hours": 72}'
```

### Recommended Template
```bash
curl http://localhost:3000/api/home | jq '.mission.recommended_template.score'
# Esperado: 100
```

---

## ✅ Checklist

- [x] Chaves canônicas implementadas
- [x] Snooze 72h funcionando
- [x] `score` e `moment_of_life_match` no template
- [x] UI com 3 botões
- [x] Tracking `home_confirmation_snoozed`
- [x] Gate anti-loop completo

---

**Status:** ✅ Pronta para produção
