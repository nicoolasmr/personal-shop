# API Gold Standard (Antigravity Rules)

**Propósito:** Definir o padrão obrigatório para criação e manutenção de rotas API seguras e consistentes.
**Status:** Obrigatório a partir da Sprint 4.5.

---

## 1. Estrutura Canônica

Toda rota deve seguir este esqueleto:

```typescript
import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler'; // Wrapper obrigatório
import { z } from 'zod'; // Validação obrigatória

// 1. Definição de Schemas (Input/Output)
const querySchema = z.object({
    q: z.string().min(1).max(100),
    page: z.coerce.number().optional().default(1)
});

// 2. Handler Protegido
export const GET = apiHandler(async (req, ctx) => {
    // 3. Validação de Input (Fail Fast)
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
    
    if (!parsed.success) {
        // 4. Retorno de Erro Semântico (400)
        return NextResponse.json(
            { error: 'Invalid input', details: parsed.error.flatten() }, 
            { status: 400 }
        );
    }

    // 5. Lógica de Negócio (com Contexto Seguro)
    const { orgId } = ctx; // Garantido pelo apiHandler
    const data = await MyService.find(orgId, parsed.data);

    // 6. Retorno de Sucesso (200)
    return NextResponse.json({ data });

}, { 
    // 7. Configuração de Segurança explícita
    requireAuth: true, 
    requireOrg: true 
});
```

---

## 2. Regras de Ouro (Do's and Don'ts)

### 🚨 Input Security
*   **DO:** Validar `searchParams`, `params` e `body` com Zod.
*   **DO:** Usar `.safeParse()` e tratar o erro explicitamente.
*   **DON'T:** Confiar em `req.json()` ou `searchParams.get()` sem validação.
*   **DON'T:** Usar `any` no payload.

### 🔒 Auth & Scoping
*   **DO:** Usar `apiHandler` para garantir que o usuário está autenticado e na organização correta.
*   **DO:** Passar `orgId` para TODAS as chamadas de serviço/DB.
*   **DON'T:** Ler headers de auth manualmente (`req.headers.get('Authorization')`).
*   **DON'T:** Fazer queries globais sem filtro de `org_id`.

### 🚦 HTTP Status Codes
*   **200 OK:** Sucesso padrão.
*   **400 Bad Request:** Erro de validação Zod.
*   **401 Unauthorized:** Falha de auth (tratado pelo wrapper).
*   **403 Forbidden:** Usuário logado mas sem permissão no recurso.
*   **404 Not Found:** Recurso não existe para este OrgID.
*   **500 Internal Server Error:** Bug não tratado (evitar ao máximo).

---

## 3. Checklist de Implementação

Antes de commitar:
- [ ] Zod Schema definido para TODOS os inputs?
- [ ] Tratamento de erro 400 implementado?
- [ ] `org_id` usado em todas as queries?
- [ ] Wrapper `apiHandler` aplicado?
