# Relatório Sprint 4.5: Route Audit & Alignment (Evidence-Based)

**Status:** Em Execução
**Estratégia:** CORE FIRST (Segurança API + Conversão UI)
**Metodologia:** Scans Mecânicos (Sem Chute)

---

## 1. Inventário Verificável (Fonte da Verdade)

### 🖥️ UI Routes (20 Rotas Reais)
*Gerado via scan em `apps/web/src/app/app`*

| URL | File Path | Tipo | Status Inicial |
|---|---|---|---|
| `/app` | `apps/web/src/app/app/page.tsx` | Core | ✅ Conforme |
| `/app/scan` | `apps/web/src/app/app/scan/page.tsx` | Core | ✅ Conforme (v3) |
| `/app/search` | `apps/web/src/app/app/search/page.tsx` | Core | ✅ Conforme (v3) |
| `/app/missions` | `apps/web/src/app/app/missions/page.tsx` | Core | ⚠️ UI Legada |
| `/app/missions/[id]` | `apps/web/src/app/app/missions/[id]/page.tsx` | Core | ❌ Cards Manuais |
| `/app/missions/[id]/cart` | `apps/web/src/app/app/missions/[id]/cart/page.tsx` | Core | ⚠️ UI Legada |
| `/app/purchases/new` | `apps/web/src/app/app/purchases/new/page.tsx` | Core | ❌ Hex Hardcoded |
| `/app/purchases/confirm` | `apps/web/src/app/app/purchases/confirm/page.tsx` | Core | ✅ Conforme |
| `/app/alerts` | `apps/web/src/app/app/alerts/page.tsx` | Core | ⚠️ UI Inconsistente |
| `/app/alerts/new` | `apps/web/src/app/app/alerts/new/page.tsx` | Core | ⚠️ UI Legada |
| `/app/dashboard/economy` | `apps/web/src/app/app/dashboard/economy/page.tsx` | Dash | ❌ Hex Hardcoded |
| `/app/dashboard/ab-tests` | `apps/web/src/app/app/dashboard/ab-tests/page.tsx` | Dash | ⚠️ UI Legada |
| `/app/settings/profile` | `apps/web/src/app/app/settings/profile/page.tsx` | Settings | ✅ Conforme |
| `/app/settings/notifications`| `apps/web/src/app/app/settings/notifications/page.tsx`| Settings | ✅ Conforme |
| `/app/settings/whatsapp` | `apps/web/src/app/app/settings/whatsapp/page.tsx` | Settings | ✅ Conforme |
| `/app/settings/guardrails` | `apps/web/src/app/app/settings/guardrails/page.tsx` | Settings | ✅ Conforme |
| `/app/settings/organizations`| `apps/web/src/app/app/settings/organizations/page.tsx`| Settings | ✅ Conforme |
| `/app/whatsapp-outbox` | `apps/web/src/app/app/whatsapp-outbox/page.tsx` | Ops | ⚠️ UI Legada |
| `/app/notifications` | `apps/web/src/app/app/notifications/page.tsx` | Core | ✅ Conforme |
| `/app/onboarding` | `apps/web/src/app/app/onboarding/page.tsx` | Core | ❌ Hex Hardcoded |

### 🔌 API Routes (47 Rotas Reais)
*Gerado via scan em `apps/web/src/app/api`*

**CORE RISKS (Foco Sprint 4.5):**
| Rota | File Path | Input | Risco | Status |
|---|---|---|---|---|
| `/api/search` | `apps/web/src/app/api/search/route.ts` | Query Param | **CRÍTICO** | ❌ Sem Zod |
| `/api/missions/[id]` | `apps/web/src/app/api/missions/[id]/route.ts` | Path Param | **ALTO** | ❌ Sem Zod |
| `/api/purchases` | `apps/web/src/app/api/purchases/route.ts` | Body JSON | **ALTO** | ⚠️ Parcial |
| `/api/alerts` | `apps/web/src/app/api/alerts/route.ts` | Body JSON | **MÉDIO** | ❌ Sem Zod |

*(Demais 43 rotas listadas no inventário completo)*

---

## 2. Matriz de Conformidade & Execução

### UI Patch Plan (Conversion & Trust)
| Rota | Problema | Solução | Status |
|---|---|---|---|
| `/app/purchases/new` | Cores `#94a3b8` hardcoded | Usar Tokens + PrimaryCTA | ⏳ Pendente |
| `/app/missions/[id]` | "Cards" manuais (`div`) | Implementar `OfferCard` v3 | ⏳ Pendente |
| `/app/alerts` | Alertas manuais | Implementar `OfferCard` v3 | ⏳ Pendente |

### API Hardening Plan (Security)
| Rota | Problema | Solução | Status |
|---|---|---|---|
| `/api/search` | `searchParams.get` direto | `z.object({ query })` | ⏳ Pendente |
| `/api/missions/[id]` | Parse manual de ID | `z.string().uuid()` | ⏳ Pendente |

---

## 3. Log de Execução

- [x] Inventário Criado
- [x] Governança Criada (Gold Standard)
- [ ] API Hardening Executado
- [ ] UI Alignment Executado
- [ ] Scan Mecânico Final

---

**Status Final:** 🚧 Em Progresso
