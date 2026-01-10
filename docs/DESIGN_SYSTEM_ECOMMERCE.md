# Design System E-commerce - Personal Shop

**Versão:** 1.0  
**Data:** 10/01/2026  
**Status:** ✅ Ativo

---

## 📋 Filosofia do Design

O Personal Shop segue o **mental model de e-commerce brasileiro confiável**, inspirado em Mercado Livre e Amazon.

### Princípios Fundamentais

1. **Confiança > Inovação**
   - Design conservador e previsível
   - Padrões reconhecíveis
   - Sem experimentos visuais

2. **Clareza > Estética**
   - Hierarquia visual óbvia
   - CTAs sempre visíveis
   - Preços em destaque

3. **Consistência > Flexibilidade**
   - Componentes padronizados
   - Tokens obrigatórios
   - Exceções justificadas

---

## 🎨 Design Tokens

### Cores

#### Brand
```css
--brand-primary: #3483fa;        /* Azul principal (inspirado ML) */
--brand-primary-hover: #2968c8;  /* Hover state */
--brand-primary-light: #e8f1ff;  /* Background leve */
```

#### Actions
```css
--color-success: #00a650;        /* Verde compra/confirmação */
--color-warning: #ff9500;        /* Laranja alerta */
--color-danger: #f23d4f;         /* Vermelho crítico */
```

#### Text
```css
--text-primary: #333333;         /* Texto principal */
--text-secondary: #666666;       /* Texto secundário */
--text-muted: #999999;           /* Texto desabilitado */
--text-white: #ffffff;           /* Texto em fundos escuros */
```

#### Background
```css
--bg-white: #ffffff;             /* Fundo branco */
--bg-light: #f5f5f5;             /* Fundo cinza claro */
--bg-card: #ffffff;              /* Fundo de cards */
--bg-hover: #fafafa;             /* Hover state */
```

#### Border
```css
--border-default: #e5e5e5;       /* Borda padrão */
--border-hover: #cccccc;         /* Borda hover */
--border-focus: #3483fa;         /* Borda focus */
```

### Espaçamento

```css
--space-xs: 0.25rem;  /* 4px  - Micro espaçamentos */
--space-sm: 0.5rem;   /* 8px  - Pequeno */
--space-md: 1rem;     /* 16px - Padrão */
--space-lg: 1.5rem;   /* 24px - Grande */
--space-xl: 2rem;     /* 32px - Extra grande */
--space-2xl: 3rem;    /* 48px - Seções */
```

### Tipografia

#### Tamanhos
```css
--font-size-xs: 0.75rem;   /* 12px - Labels, badges */
--font-size-sm: 0.875rem;  /* 14px - Subtítulos */
--font-size-md: 1rem;      /* 16px - Texto padrão */
--font-size-lg: 1.25rem;   /* 20px - Títulos de seção */
--font-size-xl: 1.5rem;    /* 24px - Títulos principais */
--font-size-2xl: 2rem;     /* 32px - Preços grandes */
```

#### Pesos
```css
--font-weight-normal: 400;     /* Texto normal */
--font-weight-medium: 500;     /* Ênfase leve */
--font-weight-semibold: 600;   /* Ênfase média */
--font-weight-bold: 700;       /* Ênfase forte */
```

### Bordas e Sombras

```css
--radius-sm: 4px;  /* Pequeno */
--radius-md: 6px;  /* Médio */
--radius-lg: 8px;  /* Grande */

--shadow-sm: 0 1px 2px rgba(0,0,0,0.08);  /* Sutil */
--shadow-md: 0 2px 4px rgba(0,0,0,0.12);  /* Padrão */
--shadow-lg: 0 4px 8px rgba(0,0,0,0.16);  /* Elevado */
```

---

## 🧩 Componentes Oficiais

### 1. AppShell
**Uso:** Wrapper obrigatório para todas as rotas `/app/*`

```tsx
import { AppShell } from '@/components/ecommerce';

export default function Layout({ children }) {
    return <AppShell>{children}</AppShell>;
}
```

**Características:**
- Topbar fixa
- Navegação consistente
- Container centralizado

---

### 2. PriceBlock
**Uso:** Exibição de preços

```tsx
import { PriceBlock } from '@/components/ecommerce';

<PriceBlock 
    price={49.90} 
    originalPrice={79.90} 
    discount={38} 
    size="lg" 
/>
```

**Props:**
- `price` (required): Preço atual
- `originalPrice` (optional): Preço original
- `discount` (optional): Percentual de desconto
- `size`: 'sm' | 'md' | 'lg'

---

### 3. PrimaryCTA
**Uso:** Botões de ação principal

```tsx
import { PrimaryCTA } from '@/components/ecommerce';

<PrimaryCTA 
    href="/app/scan" 
    variant="success" 
    size="lg"
    fullWidth
>
    📸 Escanear Produto
</PrimaryCTA>
```

**Variants:**
- `primary`: Azul (ações principais)
- `success`: Verde (compras, confirmações)
- `danger`: Vermelho (ações destrutivas)

**Sizes:**
- `sm`: Pequeno
- `md`: Médio (padrão)
- `lg`: Grande

---

### 4. ListItem
**Uso:** Itens de lista comercial

```tsx
import { ListItem } from '@/components/ecommerce';

<ListItem
    title="Meus Alertas"
    subtitle="5 alertas ativos"
    badge="3 novos"
    badgeVariant="warning"
    action={<PrimaryCTA size="sm">Ver</PrimaryCTA>}
/>
```

---

### 5. OfferCard
**Uso:** Exibição padronizada de ofertas

```tsx
import { OfferCard } from '@/components/ecommerce';

<OfferCard
    offer={{
        id: '123',
        title: 'Notebook Dell',
        image_url: '/img.jpg',
        partner_key: 'amazon',
        final_price: 2499.90,
        original_price: 2999.90,
        discount: 17
    }}
    onBuy={(id) => handleBuy(id)}
    variant="best"
/>
```

**Variants:**
- `default`: Padrão
- `best`: Melhor preço (badge verde)

---

## ✅ DO / ❌ DON'T

### DO ✅

**Usar tokens:**
```css
.myComponent {
    color: var(--text-primary);
    padding: var(--space-md);
    border-radius: var(--radius-sm);
}
```

**Usar componentes oficiais:**
```tsx
<PrimaryCTA variant="success">Comprar</PrimaryCTA>
```

**Seguir hierarquia:**
```tsx
<h1 style={{ fontSize: 'var(--font-size-xl)' }}>Título</h1>
<p style={{ fontSize: 'var(--font-size-md)' }}>Texto</p>
```

---

### DON'T ❌

**Hardcoded colors:**
```css
/* ❌ ERRADO */
.myComponent {
    color: #3483fa;
    padding: 16px;
}
```

**Botões customizados:**
```tsx
{/* ❌ ERRADO */}
<button style={{ background: 'blue' }}>Comprar</button>
```

**Valores mágicos:**
```tsx
{/* ❌ ERRADO */}
<div style={{ marginTop: '23px' }}>...</div>
```

---

## 🚨 Regra de Exceção

**Quando fugir do padrão:**

1. **Justificativa obrigatória** no código:
```tsx
{/* EXCEÇÃO: Design específico para hero promocional */}
<div style={{ background: 'linear-gradient(...)' }}>
```

2. **Aprovação do CTO** para componentes novos

3. **Documentação** no PR

**Exceções permitidas:**
- Promoções especiais (temporárias)
- A/B tests (com flag)
- Páginas de marketing (fora de /app/*)

---

## 📦 Utility Classes

### Container
```html
<div class="ecomContainer">
    <!-- Conteúdo centralizado -->
</div>
```

### Card
```html
<div class="ecomCard">
    <!-- Card padrão -->
</div>
```

### Grid
```html
<div class="ecomGrid cols2">
    <!-- Grid 2 colunas -->
</div>
```

### Badge
```html
<span class="ecomBadge success">ATIVO</span>
<span class="ecomBadge warning">PENDENTE</span>
<span class="ecomBadge danger">ERRO</span>
```

### Text
```html
<p class="ecomMutedText">Texto desabilitado</p>
<p class="ecomSecondaryText">Texto secundário</p>
```

---

## 🎯 Checklist de Conformidade

Antes de fazer deploy, validar:

- [ ] AppShell aplicado em TODAS as rotas /app/*
- [ ] Tokens usados (sem valores hardcoded)
- [ ] Nenhum CTA fora de PrimaryCTA
- [ ] Nenhuma oferta fora de OfferCard
- [ ] Exceções justificadas e documentadas

---

## 📚 Referências

- [tokens.css](file:///Users/nicolasmoreira/Desktop/ANTIGRAVITY-PERSORNAL%20SHOP/apps/web/src/styles/tokens.css)
- [ecom-utilities.css](file:///Users/nicolasmoreira/Desktop/ANTIGRAVITY-PERSORNAL%20SHOP/apps/web/src/styles/ecom-utilities.css)
- [Componentes](file:///Users/nicolasmoreira/Desktop/ANTIGRAVITY-PERSORNAL%20SHOP/apps/web/src/components/ecommerce/)

---

## 🔄 Versionamento

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0 | 10/01/2026 | Versão inicial - Sprint 4.3 |

---

**Dúvidas?** Consultar CTO ou abrir issue no repositório.
