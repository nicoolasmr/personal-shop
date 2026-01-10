# OfferCard v3 - Guia de Uso

**Versão:** 3.0  
**Data:** 10/01/2026  
**Objetivo:** Centro do funil de decisão

---

## 📋 Quando Usar

Use OfferCard v3 para **QUALQUER exibição de oferta** no app:
- ✅ Resultados de scan
- ✅ Ofertas em alertas disparados
- ✅ Recomendações em missões
- ✅ Comparações de preço
- ✅ Listas de produtos

---

## 🎯 Props Obrigatórias

```typescript
<OfferCard
    offer={{
        id: string;              // ID único
        title: string;           // Nome do produto
        partner_key: string;     // Loja (ex: 'amazon')
        final_price: number;     // Preço final
    }}
    onBuy={(id) => handleBuy(id)}  // Handler de compra
/>
```

---

## 🚀 Props de Conversão (v3)

### whyThisOffer
**Objetivo:** Explicar POR QUE esta oferta é boa.

**Quando usar:**
- Sempre na **primeira oferta** (melhor)
- Quando houver motivo claro

**Exemplos:**
```typescript
whyThisOffer="Melhor preço encontrado"
whyThisOffer="Produto mais vendido"
whyThisOffer="Recomendado para você"
whyThisOffer="Melhor custo-benefício"
```

**Visual:**
```
┌────────────────────────────────┐
│ Por que esta oferta?           │
│ Melhor preço encontrado        │
└────────────────────────────────┘
(Fundo azul claro, borda azul)
```

---

### comparedTo
**Objetivo:** Dar contexto de comparação.

**Quando usar:**
- Quando há múltiplas ofertas
- Quando há histórico de preços
- Quando há média conhecida

**Exemplos:**
```typescript
comparedTo="R$ 50 mais barato que a 2ª opção"
comparedTo="15% abaixo do preço histórico"
comparedTo="R$ 100 abaixo da média de 7 dias"
comparedTo="Melhor que 95% das ofertas"
```

**Visual:**
```
💰 R$ 50 mais barato que a 2ª opção
(Verde, negrito)
```

---

### riskIndicator
**Objetivo:** Reduzir percepção de risco.

**Quando usar:**
- Sempre que possível na primeira oferta
- Quando preço é verificado
- Quando há garantia

**Estrutura:**
```typescript
riskIndicator={{
    level: 'low' | 'medium' | 'high',
    message: string
}}
```

**Exemplos (level: 'low'):**
```typescript
riskIndicator={{
    level: 'low',
    message: 'Preço verificado e confiável'
}}

riskIndicator={{
    level: 'low',
    message: 'Abaixo da média de 7 dias'
}}

riskIndicator={{
    level: 'low',
    message: 'Preço estável nos últimos 30 dias'
}}
```

**Visual:**
```
✓ Preço verificado e confiável
(Verde claro, badge)
```

---

### urgency
**Objetivo:** Criar senso de urgência (usar com moderação).

**Quando usar:**
- Estoque baixo (real)
- Promoção temporária (real)
- Preço volátil (real)

**⚠️ NUNCA usar urgência falsa!**

**Estrutura:**
```typescript
urgency={{
    type: 'stock' | 'price' | 'time',
    message: string
}}
```

**Exemplos:**
```typescript
// Stock
urgency={{
    type: 'stock',
    message: 'Últimas 3 unidades'
}}

// Price
urgency={{
    type: 'price',
    message: 'Preço pode subir a qualquer momento'
}}

// Time
urgency={{
    type: 'time',
    message: 'Promoção válida até hoje'
}}
```

**Visual:**
```
⚡ Últimas 3 unidades
(Laranja, badge)
```

---

## 🏆 Hierarquia Visual

### Primeira Oferta (Melhor)
```tsx
<OfferCard
    variant="best"
    whyThisOffer="Melhor preço encontrado"
    comparedTo="R$ 50 mais barato que a 2ª opção"
    riskIndicator={{
        level: 'low',
        message: 'Preço verificado'
    }}
    offer={...}
    onBuy={handleBuy}
/>
```

**Resultado:**
- Badge verde "MELHOR PREÇO"
- Borda verde (2px)
- "Por que esta oferta?" explicado
- Comparação visível
- Risk indicator presente

---

### Outras Ofertas
```tsx
<OfferCard
    variant="default"
    offer={...}
    onBuy={handleBuy}
/>
```

**Resultado:**
- Sem badge
- Borda padrão
- Sem whyThisOffer
- Sem comparedTo
- Sem risk indicator

---

## 💡 Exemplo Completo (Scan)

```tsx
{result.suggestions.map((offer: any, idx: number) => {
    const isFirst = idx === 0;
    const secondPrice = result.suggestions[1]?.final_price;
    
    return (
        <OfferCard
            key={offer.id}
            offer={{
                id: offer.id,
                title: offer.title,
                image_url: offer.image_url,
                partner_key: offer.partner_key,
                final_price: offer.final_price,
                original_price: offer.original_price,
                discount: offer.discount,
                trust_score: 85
            }}
            variant={isFirst ? 'best' : 'default'}
            whyThisOffer={isFirst ? 'Melhor preço encontrado' : undefined}
            comparedTo={isFirst && secondPrice 
                ? `R$ ${(secondPrice - offer.final_price).toFixed(2)} mais barato que a 2ª opção`
                : undefined
            }
            riskIndicator={isFirst ? {
                level: 'low',
                message: 'Preço verificado e confiável'
            } : undefined}
            onBuy={(id) => handleBuy(offer)}
            onCreateAlert={(id) => handleCreateAlert(offer)}
            loading={processingBuy[offer.id]}
        />
    );
})}
```

---

## ✅ DO / ❌ DON'T

### DO ✅

**Sempre explicar POR QUE na primeira oferta:**
```tsx
<OfferCard
    variant="best"
    whyThisOffer="Melhor preço encontrado"
    ...
/>
```

**Comparar com algo concreto:**
```tsx
comparedTo="R$ 50 mais barato que a 2ª opção"
comparedTo="15% abaixo da média"
```

**Mostrar confiança:**
```tsx
riskIndicator={{
    level: 'low',
    message: 'Preço verificado'
}}
```

**Usar urgência com moderação e verdade:**
```tsx
urgency={{
    type: 'stock',
    message: 'Últimas 3 unidades'  // REAL
}}
```

---

### DON'T ❌

**❌ Primeira oferta sem whyThisOffer:**
```tsx
// ERRADO
<OfferCard variant="best" offer={...} />
```

**❌ Urgência falsa:**
```tsx
// ERRADO
urgency={{
    type: 'stock',
    message: 'Últimas unidades'  // Mentira
}}
```

**❌ Comparação inventada:**
```tsx
// ERRADO
comparedTo="Melhor que todos"  // Sem dados
```

**❌ Usar OfferCard sem contexto:**
```tsx
// ERRADO - Sem explicar POR QUE
<OfferCard offer={...} onBuy={...} />
```

---

## 🎨 Anatomia Visual

```
┌─────────────────────────────────────────┐
│ [MELHOR PREÇO]                (badge)   │
├─────────────────────────────────────────┤
│ [IMG]  Notebook Dell Inspiron 15        │
│ 120px  Vendido por: AMAZON              │
│        R$ 2.499,00  (-17%)              │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Por que esta oferta?                │ │
│ │ Melhor preço encontrado             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 💰 R$ 50 mais barato que a 2ª opção    │
│ 💰 Economia estimada: R$ 500,00        │
│ ✓ Preço verificado e confiável         │
│ ⚡ Últimas 3 unidades                   │
│                                         │
│ ✓ Vendedor Confiável                   │
│ 🔗 Link seguro para AMAZON             │
│                                         │
│ [🛒 Comprar pelo Melhor Preço]         │
│ [Ver Detalhes] [🔔 Criar Alerta]       │
└─────────────────────────────────────────┘
```

---

## 📊 Checklist de Qualidade

Antes de usar OfferCard v3, validar:

- [ ] Primeira oferta tem `variant="best"`
- [ ] Primeira oferta tem `whyThisOffer`
- [ ] `comparedTo` tem dados reais (não inventados)
- [ ] `riskIndicator` presente na primeira oferta
- [ ] `urgency` é verdadeira (ou não usar)
- [ ] `onBuy` handler implementado
- [ ] `loading` state gerenciado

---

## 🔄 Migração v2 → v3

**v2 (antes):**
```tsx
<div className={styles.offerCard}>
    <h3>{offer.title}</h3>
    <p>{offer.partner_key}</p>
    <p>R$ {offer.final_price}</p>
    <button onClick={() => buy(offer.id)}>Comprar</button>
</div>
```

**v3 (depois):**
```tsx
<OfferCard
    offer={offer}
    variant="best"
    whyThisOffer="Melhor preço encontrado"
    comparedTo="R$ 50 mais barato"
    riskIndicator={{ level: 'low', message: 'Preço verificado' }}
    onBuy={(id) => buy(id)}
/>
```

---

## 📚 Referências

- [OfferCard.tsx](file:///Users/nicolasmoreira/Desktop/ANTIGRAVITY-PERSORNAL%20SHOP/apps/web/src/components/ecommerce/OfferCard.tsx)
- [OfferCard.module.css](file:///Users/nicolasmoreira/Desktop/ANTIGRAVITY-PERSORNAL%20SHOP/apps/web/src/components/ecommerce/OfferCard.module.css)
- [Design System](file:///Users/nicolasmoreira/Desktop/ANTIGRAVITY-PERSORNAL%20SHOP/docs/DESIGN_SYSTEM_ECOMMERCE.md)

---

**Dúvidas?** Consultar CTO ou abrir issue no repositório.
