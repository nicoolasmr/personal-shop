# Checklist de Conformidade de Rotas

Use este checklist ao criar ou modificar qualquer rota no sistema.

## 🤖 Mechanical Checks (Faça o teste do grep)

Antes de aprovar um PR, rode estes comandos mentalmente ou no terminal:

1.  **Hex Zero:** `grep "#[0-9a-fA-F]" page.tsx` -> **Deve retornar 0 resultados.** use `var(--tokens)`
2.  **Zod Present:** `grep "z.object" route.ts` -> **Deve retornar match.** (Para APIs)
3.  **OfferCard:** `grep "OfferCard" page.tsx` -> **Deve retornar match** se a página exibe produtos.

---

## 🎨 UI Route Conformity (/app/*)

### Estrutura & Layout
- [ ] Rota está dentro de `apps/web/src/app/app/` (para herdar AppShell)?
- [ ] Título da página definido e consistente com a Topbar?

### Design System & Tokens
- [ ] **NENHUM** código Hex hardcoded (`#ffffff`)?
- [ ] Uso exclusivo de variáveis `var(--...)` para cores, espaçamentos e fontes?
- [ ] Uso de utilities `ecomStyles` (`ecomContainer`, `ecomCard`) onde possível?

### Componentes Core (Se aplicável)
- [ ] **Ofertas:** Usa `<OfferCard>` v3 (com props `whyThisOffer`, `riskIndicator`)?
- [ ] **Preços:** Usa `<PriceBlock>` para formatar valores?
- [ ] **Botões:** Usa `<PrimaryCTA>` para ação principal?
- [ ] **Listas:** Usa `<ListItem>` para listagens verticais?

### UI Contract
- [ ] Estado `Loading` tratado (`<AppLoading />` ou skeleton)?
- [ ] Estado `Empty` tratado (`<AppEmpty />`)?
- [ ] Estado `Error` tratado (`<AppError />`)?

---

## 🔒 API Route Conformity (/api/*)

### Segurança & Auth
- [ ] Usa `requireOrgContext()` ou wrapper equivalente no início?
- [ ] Verifica permissões específicas (além do login) se necessário?

### Validação de Dados (Input/Output)
- [ ] Usa **Zod** schema para validar `req.json()` ou `searchParams`?
- [ ] **NUNCA** confia em input bruto (ex: `req.body.id`) sem parse?
- [ ] Tipagem de retorno explícita (NextResponse<T>)?

### Observabilidade & Performance
- [ ] Logs de erro estruturados (`console.error` ou logger)?
- [ ] Queries de banco otimizadas (índices, sem N+1)?
- [ ] Cache headers configurados (se aplicável para GETs públicos)?
