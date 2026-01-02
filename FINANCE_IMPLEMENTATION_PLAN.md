# 📊 Plano de Implementação - Dashboard de Finanças Completo

## ✅ Funcionalidades Implementadas Anteriormente

1. **Filtros de Categoria por Aba** - Categorias filtradas por tipo (receita/despesa)
2. **Gráficos Específicos por Aba** - Cada aba tem seu gráfico relevante
3. **Cronograma de Parcelas** - Modal detalhado com todas as parcelas
4. **Todas as Transações** - Lista completa sem limite
5. **Card de Orçamento** - 5º card mostrando % utilizado

## 🚀 Novas Funcionalidades a Implementar

### 1. Atualização Automática do Orçamento
- ✅ O orçamento já atualiza automaticamente via `useFinance` hook
- ✅ Quando adiciona transação, o hook recarrega os dados
- ✅ Não precisa refresh manual

### 2. Metas de Economia/Poupança

**Estrutura:**
```typescript
interface SavingsGoal {
  id: string;
  name: string; // "Liberdade Financeira", "Viagem", etc
  target_amount: number; // Meta mensal
  current_amount: number; // Quanto já guardou
  icon: string; // emoji ou icon name
  color: string;
  deadline?: Date; // opcional
}
```

**Metas Sugeridas:**
- 💰 Liberdade Financeira
- ✈️ Viagem em Família  
- 🏠 Reserva de Emergência
- 🎓 Educação
- 🚗 Compra de Carro
- 💍 Casamento
- 🏖️ Férias

**Lógica:**
```
Receita Mensal: R$ 10.000
Despesas: R$ 6.000
Metas de Economia: R$ 2.000
---
Saldo Real Disponível: R$ 2.000
```

### 3. Interface da Aba de Orçamento

**Seção 1: Resumo Financeiro**
- Card Verde: Receita Mensal
- Card Roxo: Orçamento de Despesas
- Card Azul/Vermelho: Saldo Disponível

**Seção 2: Orçamento por Categoria**
- Lista de categorias de despesa
- Campo para definir meta mensal
- Barra de progresso
- Alertas de excesso

**Seção 3: Metas de Economia** (NOVO!)
- Lista de metas financeiras
- Botão "Adicionar Meta"
- Para cada meta:
  - Nome e ícone
  - Valor alvo mensal
  - Progresso atual
  - Barra de progresso
  - Botão editar/excluir

**Seção 4: Resumo Final**
- Total de Metas: R$ X
- Saldo após Metas: R$ Y
- Alerta se saldo negativo

## 📝 Arquivos a Modificar

1. `src/types/finance.ts` - Adicionar tipo SavingsGoal
2. `src/services/finance.ts` - Funções CRUD para metas
3. `src/hooks/useFinance.ts` - Incluir metas no hook
4. `src/pages/finance/FinancePage.tsx` - UI completa
5. `supabase/migrations/` - Nova tabela finance_savings_goals

## 🗄️ Estrutura do Banco de Dados

```sql
CREATE TABLE finance_savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#8B5CF6',
  deadline DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎯 Próximos Passos

1. ✅ Criar migration para tabela de metas
2. ✅ Atualizar tipos TypeScript
3. ✅ Criar funções no service
4. ✅ Atualizar hook useFinance
5. ✅ Implementar UI na aba de Orçamento
6. ✅ Testar fluxo completo

---

**Status:** Pronto para implementação
**Prioridade:** Alta
**Estimativa:** 30-45 minutos
