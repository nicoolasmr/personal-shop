# ADR 006: Escopo e Priorização Sprint 4.5 (Core First)

**Data:** 10/01/2026  
**Status:** Aceito

## Contexto
A auditoria de rotas identificou 20 rotas UI e 47 rotas API.
- **Risco API:** 30+ rotas sem Zod validation, incluindo críticas (search, missions).
- **Inconsistência UI:** `/missions` e `/purchases` usam UI manual, ignorando `OfferCard` v3.
- **Recursos:** Tempo limitado para "virar a chave" para e-commerce trusted.

## Decisão
Adotar estratégia **"CORE FIRST"** para o hardening da Sprint 4.5.

### 1. Hardening API (Foco em Input Externo)
Priorizar Zod Validation e Error Handling APENAS para rotas CORE que recebem input de usuário:
- `/api/search` (query injection)
- `/api/missions/*` (ID manipulation)
- `/api/purchases/*` (fraude)
- `/api/alerts` (spam)

*Rotas administrativas ou internas ficam para Sprint 4.6.*

### 2. Alinhamento UI (Foco em Conversão)
Refatorar APENAS rotas que exibem ofertas ou preços para o usuário final:
- `/app/missions/[id]` -> Aplicar `OfferCard` v3 nas sugestões.
- `/app/purchases/new` -> Remover Hex hardcoded, aplicar `ListItem`.
- `/app/alerts` -> Aplicar `OfferCard` v3.

*Rotas de settings/dashboard ficam para Sprint 4.6.*

## Consequências

### Positivas
- **ROI Imediato:** Protege as rotas mais atacadas primeiro.
- **Conversão:** Melhora a experiência onde o dinheiro é gasto (ofertas).
- **Viabilidade:** Escopo cabe em 20h.

### Negativas
- **Débito Restante:** Rotas admin continuarão "frágeis" por mais uma sprint.
- **Visual:** Settings/Dashboard continuarão com visual "legacy" (hex codes).

## Alternativas
- **"Big Bang" (Tudo de uma vez):** Inviável, estimativa de 60h+.
- **Só UI:** Ignora risco crítico de segurança na API.
