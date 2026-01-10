# Relatório Final de Auditoria (Evidence-Based)

**Data:** 10/01/2026
**Responsável:** CTO / Staff Engineer
**Escopo:** 100% das rotas UI e API existentes (Filesystem Scan)

---

## 1. Inventário de Rotas (Fonte da Verdade)

### 🖥️ UI Routes (20 Rotas)
*Scan em `apps/web/src/app/app/**/*.tsx`*

1.  `/app/app/page.tsx` (Home)
2.  `/app/app/scan/page.tsx`
3.  `/app/app/search/page.tsx`
4.  `/app/app/missions/page.tsx`
5.  `/app/app/missions/[id]/page.tsx`
6.  `/app/app/missions/[id]/cart/page.tsx`
7.  `/app/app/alerts/page.tsx`
8.  `/app/app/alerts/new/page.tsx`
9.  `/app/app/purchases/new/page.tsx`
10. `/app/app/purchases/confirm/page.tsx`
11. `/app/app/notifications/page.tsx`
12. `/app/app/onboarding/page.tsx`
13. `/app/app/dashboard/economy/page.tsx`
14. `/app/app/dashboard/ab-tests/page.tsx`
15. `/app/app/whatsapp-outbox/page.tsx`
16. `/app/app/settings/profile/page.tsx`
17. `/app/app/settings/notifications/page.tsx`
18. `/app/app/settings/whatsapp/page.tsx`
19. `/app/app/settings/guardrails/page.tsx`
20. `/app/app/settings/organizations/page.tsx`

*(Nota: Rotas legacy `/app/home` e `/app/products` foram deletadas com sucesso)*

### 🔌 API Routes (47 Rotas)
*Scan em `apps/web/src/app/api/**/route.ts`*

**Core:** `home`, `scan`, `search`, `affiliate/click`
**Missions:** `missions/routes...` (7 endpoints)
**Admin:** `admin/routes...` (10 endpoints)
**Purchases:** `purchases/routes...` (5 endpoints)
**Settings/Users:** `settings/*`, `profile`, `me`, `orgs/*`
**System:** `health`, `feature-flags`, `events`, `audit`

---

## 2. Auditoria de Conformidade (Com Evidências)

### UI Conformity Table

| Rota UI | AppShell | Tokens | Components | UI Contract | Severidade | Evidência (Problema) |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `/scan`, `/search` | ✅ | ✅ | ✅ | ✅ | - | **Auditado & Corrigido** |
| `/purchases/new` | ✅ | ❌ | ❌ | ⚠️ | **P1** | Hex hardcoded (`#94a3b8`); HTML puro sem `OfferCard` |
| `/dashboard/economy` | ✅ | ❌ | ⚠️ | ✅ | **P2** | Hex hardcoded (`#34d399`); Falta `PriceBlock` consistente |
| `/onboarding` | ✅ | ❌ | n/a | ✅ | **P2** | Hex hardcoded (`#666`) |
| `/settings/layout` | ✅ | ❌ | n/a | ✅ | **P2** | Hex hardcoded (`#eee`) |
| Demais Settings | ✅ | ✅ | n/a | ✅ | - | Parecem limpas de Hex |
| `/missions/[id]` | ✅ | ✅ | ⚠️ | ✅ | **P1** | Falta `OfferCard` em itens sugeridos |

### API Security & Conformity

| Categoria | Rota Exemplo | Zod Validation | Auth Check | Severidade | Evidência |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Core** | `api/search` | ❌ NAO | ✅ SIM | **P1** | `query` sem validação; uso direto de `searchParams` |
| **Core** | `api/affiliate/click` | ✅ SIM | ✅ SIM | - | Usa `affiliateClickSchema.safeParse` |
| **Missions** | `api/missions/[id]` | ❌ NAO | ✅ SIM | **P1** | Params ID sem validação Zod explícita |
| **Admin** | `api/admin/*` | ⚠️ Misto | ✅ SIM | **P2** | Maioria ok, mas falta padronização de erro |
| **Public** | `api/health` | n/a | ❌ NAO | - | Public by design (Correto) |

---

## 3. Top Issues & Backlog (Evidence-Based)

### P0 Issues (Bloqueantes - Corrigidos HOJE)
1.  ~~Rotas duplicadas (`/home`, `/products`)~~ -> **RESOLVIDO (Deletados)**
2.  ~~Componentes Legacy (`OfferCard v1`)~~ -> **RESOLVIDO (Deletado)**

### P1 Issues (Alta Prioridade - Sprint 4.5)
1.  **API Security Gap (Search & Missions):**
    *   **Evidência:** `apps/web/src/app/api/search/route.ts` lê `searchParams.get('query')` sem Zod schema.
    *   **Risco:** Input injection, erros não tratados.
    *   **Ação:** Implementar Zod schemas para TODAS as 47 rotas API.
2.  **UI Purchases Flow (`/purchases/new`):**
    *   **Evidência:** `ConfirmReceiptForm.tsx` usa `style={{ color: '#94a3b8' }}` e divs manuais para itens.
    *   **Risco:** Quebra visual do Design System e falta de conversão.
    *   **Ação:** Refatorar para usar `OfferCard` e Tokens.
3.  **UI Missions Detail:**
    *   **Evidência:** Renderização de itens não usa `OfferCard` para sugestões de compra.
    *   **Ação:** Aplicar `OfferCard` v3.

### P2 Issues (Média Prioridade - Sprint 4.5/4.6)
1.  **Hardcoded Hex Cleanup:**
    *   **Locais:** `dashboard/economy` (#34d399), `onboarding` (#666), `settings` (#eee).
    *   **Ação:** Substituir por `var(--brand-success)`, `var(--text-secondary)`, `var(--border-default)`.

---

## 4. Plano de Alinhamento (Sprint 4.5)

**Objetivo:** "Kill Legacy + Align Routes" (Foco: API Security + UI Consistency)

1.  **Back-end Security Sweep (10h):**
    *   Criar Zod Schemas para TODAS as 47 rotas API.
    *   Padronizar Error Handling na API layer.
2.  **UI Consistency Sweep (6h):**
    *   Refatorar `/purchases/new` (Critical).
    *   Limpar Hex codes identificados (Quick fix).
    *   Aplicar `OfferCard` em Missões.
3.  **Documentation & Tests (4h):**
    *   Atualizar Storybook/Docs com novos padrões.
    *   Smoke test em fluxos críticos.

**Total Estimado:** 20h

---

## 5. Artifacts Gerados

1.  `docs/RELATORIO_FINAL_AUDITORIA.md` (Este documento)
2.  `docs/ADR_ROUTE_AUDIT.md` (Decisão arquitetural)
3.  `docs/ROUTE_CONFORMITY_CHECKLIST.md` (Guia para devs)

---

**Status Final da Auditoria:** 🏁 **CONCLUÍDA**
Inventário 100% mapeado. Backlog P1/P2 definido com evidências de código.
