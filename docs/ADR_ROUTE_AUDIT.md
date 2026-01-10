# ADR 005: Auditoria e Padronização de Rotas (UI & API)

**Data:** 10/01/2026  
**Status:** Aceito

## Contexto
O Personal Shop cresceu organicamente, resultando em 20 rotas UI e 47 rotas API com padrões de implementação mistos. Observamos:
- **UI:** Mistura de CSS Modules locais, Hex hardcoded e (recentemente) Design System tokens.
- **API:** Inconsistência na validação (alguns usam Zod, outros parsing manual) e scoping de organização.
- **UX:** Componentes visuais críticos (como cards de oferta) variavam entre implementações.

## Decisão
Estabelecer um "Padrão de Ouro" (Gold Standard) para todas as rotas e executar um plano de alinhamento obrigatório.

### 1. Padrão UI (Obrigatório)
Todas as rotas sob `/app/app/*` DEVEM:
- Usar **AppShell** global (via layout).
- Usar **Tokens** CSS (`var(--...)`) exclusivamente. Proibido Hex hardcoded.
- Usar **Componentes Oficiais** para domínios core:
  - Ofertas -> `OfferCard` (v3)
  - Preços -> `PriceBlock`
  - Ações -> `PrimaryCTA`
  - Listas -> `ListItem`

### 2. Padrão API (Obrigatório)
Todas as rotas sob `/api/*` DEVEM:
- Usar **Zod** para validação de INPUT (body/params) e OUTPUT.
- Usar `apiHandler` ou `requireOrgContext` para Auth/Org scoping.
- Retornar códigos HTTP semânticos (400, 401, 403, 404, 500).

## Consequências

### Positivas
- **Manutenibilidade:** Código uniforme reduz tempo de onboarding.
- **Segurança:** Validação Zod obrigatória mitiga injeção e dados sujos.
- **UX:** Consistência visual aumenta confiança do usuário e conversão.
- **Observabilidade:** Padrões uniformes facilitam rastreamento de erros.

### Negativas
- **Custo Inicial:** Refatoração massiva (~30 APIs, ~10 telas UI) necessária na Sprint 4.5.
- **Rigidez:** Menor liberdade para "hacks" rápidos de CSS/API.

## Alternativas Rejeitadas
- **Manter Legacy:** Inviável dado o risco de segurança e a meta de "confiança e-commerce".
- **Refatoração Gradual (On-demand):** Rejeitado pois cria dívida técnica permanente ("janelas quebradas").
