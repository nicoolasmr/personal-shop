# Relatório de Alinhamento de Rotas - Sprint 4.5

**Data:** 10/01/2026
**Responsável:** CTO
**Meta:** Alinhamento E-commerce First (UI) + Hardening (API)

---

## 1. Inventário Verificável (Fonte da Verdade)

### 🖥️ UI Routes (20 Rotas)
Lista extraída de `apps/web/src/app/app/**/*.tsx`:

| URL | File Path | Status |
|---|---|---|
| `/app` | `apps/web/src/app/app/page.tsx` | ✅ Core |
| `/app/scan` | `apps/web/src/app/app/scan/page.tsx` | ✅ Core - v3 OK |
| `/app/search` | `apps/web/src/app/app/search/page.tsx` | ✅ Core - v3 OK |
| `/app/missions` | `apps/web/src/app/app/missions/page.tsx` | ⚠️ UI Inconsistente |
| `/app/missions/[id]` | `apps/web/src/app/app/missions/[id]/page.tsx` | ❌ Manual Cards |
| `/app/purchases/new` | `apps/web/src/app/app/purchases/new/page.tsx` | ❌ Hex Hardcoded |
| `/app/alerts` | `apps/web/src/app/app/alerts/page.tsx` | ⚠️ UI Inconsistente |
| ... e 13 rotas secundárias (settings, dashboard, etc) |

### 🔌 API Routes (47 Rotas)
Lista extraída de `apps/web/src/app/api/**/*.ts`:

| Rota | File Path | Auth | Zod | Risco |
|---|---|---|---|---|
| `/api/search` | `.../search/route.ts` | ✅ | ❌ | **ALTO** |
| `/api/missions/[id]` | `.../missions/[id]/route.ts` | ✅ | ❌ | **ALTO** |
| `/api/affiliate/click` | `.../affiliate/click/route.ts` | ✅ | ✅ | Baixo |
| ... e 44 rotas adicionais |

---

## 2. Plano de Execução (Patch Plan)

Este plano foca nas rotas de **ALTO RISCO** e **ALTA CONVERSÃO**.

### 🧩 UI Patches (Prioridade 1)

#### P1-UI-02: `/app/missions/[id]`
- **Problema:** Usa `div.suggestionCard` manual e botões HTML puros.
- **Ação:** Substituir loop de sugestões por `<OfferCard variant="default" />`.
- **Meta:** Conversão e consistência visual.

#### P1-UI-04: `/app/purchases/new`
- **Problema:** Hex codes `#94a3b8` e estilo manual em `ConfirmReceiptForm`.
- **Ação:** Remover styles inline, usar tokens `var(--text-muted)`, usar componentes.

### 🛡️ API Patches (Prioridade 2)

#### P2-API-01: `/api/search`
- **Problema:** `searchParams.get('query')` sem validação.
- **Ação:** `z.object({ query: z.string().min(1) }).parse(...)`.

#### P2-API-02: `/api/missions/[id]`
- **Problema:** Parse manual de ID na URL.
- **Ação:** Validar ID com Zod (UUID ou formato esperado).

---

## 3. Backlog Remanescente (P2)
- Hardening das 43 rotas API restantes (Admin, Settings).
- Refatoração UI de Settings/Dashboard (Hex removal).
- Acessibilidade audit.

---

**Aprovação:** __________________________
