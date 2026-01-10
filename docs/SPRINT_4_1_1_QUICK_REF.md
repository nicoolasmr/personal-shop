# Sprint 4.1.1 - Quick Reference

## 📁 Arquivos Modificados

```
apps/web/src/
├── lib/
│   └── safe-query.ts                                    ✨ NOVO
├── app/
│   ├── api/
│   │   ├── home/route.ts                                🔄 REESCRITO
│   │   └── purchases/confirmations/[token]/dismiss/
│   │       └── route.ts                                 ✨ NOVO
│   └── app/
│       └── page.tsx                                     🔄 REESCRITO
└── server/purchases/
    └── attribution-service.ts                           🔧 ALTERADO

docs/
└── RELATORIO_SPRINT_4_1_1.md                            ✨ NOVO
```

---

## 🎯 Principais Mudanças

### 1. Tracking Correto
- ❌ **Antes:** `home_viewed` no server (supercontagem)
- ✅ **Depois:** `home_viewed` no client (1x/mount) + `home_api_served` no server

### 2. Partial Failures
- ❌ **Antes:** "Nunca retorna 500" (mentira)
- ✅ **Depois:** `meta.partial_failures: string[]` no response

### 3. Recommended Template
- ❌ **Antes:** `null` (TODO)
- ✅ **Depois:** Via `MissionPriority.rankTemplates()`

### 4. Unread Notifications
- ❌ **Antes:** Mockado (`0`)
- ✅ **Depois:** Query real em `notifications` table

### 5. Gate Anti-Loop
- ❌ **Antes:** Confirmação aparecia sempre
- ✅ **Depois:** Cooldown 24h + botão "Dispensar"

### 6. Empty State
- ❌ **Antes:** Mensagem genérica
- ✅ **Depois:** 2 CTAs (Scan + Criar Alerta)

---

## 📊 Eventos de Tracking

| Evento | Onde | Quando |
|--------|------|--------|
| `home_api_served` | Server | Ao finalizar `/api/home` |
| `home_viewed` | Client | Após render success (1x/mount) |
| `home_primary_cta_clicked` | Client | Click no Hero CTA |
| `home_action_card_clicked` | Client | Click em card do grid |
| `home_confirmation_dismissed` | Server | Dispensar confirmação |
| `home_empty_cta_clicked` | Client | Click em CTA do empty state |

---

## 🔍 Response Schema (Mudanças)

```diff
{
  meta: {
    moment_of_life: string | null,
    whatsapp_opt_in: boolean,
-   unread_notifications: 0,                    // MOCKADO
+   unread_notifications: number,               // QUERY REAL
    has_pending_confirmations: boolean,
+   partial_failures: string[]                  // NOVO
  },
  mission: {
    active: {...} | null,
-   recommended_template: null                  // TODO
+   recommended_template: {                     // IMPLEMENTADO
+     key: string,
+     title: string,
+     priority_reason: string,
+     href: string
+   } | null
  }
}
```

---

## 🛡️ Gate de Confirmações

**Cooldown:** 24 horas  
**Campos:**
- `attribution_links.meta.dismissed_at`
- `attribution_links.meta.last_prompted_at`

**Lógica:**
1. Só mostra se < 7 dias
2. Só mostra se não dispensado
3. Só mostra se nunca mostrado OU > 24h desde último prompt
4. Só mostra se não confirmado

---

## 🧪 Como Testar

### Partial Failures
```sql
ALTER TABLE notifications RENAME TO notifications_backup;
```
→ Home carrega com `partial_failures: ['notifications', 'recentTriggers']`

### Recommended Template
```sql
DELETE FROM mission_instances WHERE user_id = 'user_123';
```
→ Hero mostra missão recomendada baseada em `moment_of_life`

### Cooldown
1. Acesse `/app` → Confirmação aparece
2. Refresh → Confirmação **não aparece** (24h)

### Dismiss
1. Clique "Dispensar"
2. Refresh → Confirmação **não retorna**

---

## ✅ Checklist

- [x] Tracking client-side (1x/mount)
- [x] `partial_failures` implementado
- [x] `recommended_template` funcionando
- [x] `unread_notifications` real
- [x] Gate anti-loop (cooldown + dismiss)
- [x] Empty state com 2 CTAs
- [x] `sendBeacon` para tracking não-bloqueante

---

**Status:** ✅ Pronta para produção
