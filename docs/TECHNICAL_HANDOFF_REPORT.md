# VIDA360 — Technical Handoff Report

**Data:** 2025-12-27  
**Versão:** 3.3.0  
**Status:** Em desenvolvimento ativo

---

## 📋 Sumário Executivo

O VIDA360 é uma plataforma de produtividade pessoal multi-tenant que integra **Hábitos, Tarefas, Metas, Finanças e Calendário** em uma experiência unificada. A aplicação possui sistema de gamificação com XP/níveis e dashboard visual na Home.

---

## 🏗️ Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| **Frontend** | React | 18.3.1 |
| **Build** | Vite | Latest |
| **Linguagem** | TypeScript | 5.x |
| **Estilização** | Tailwind CSS | 3.x |
| **UI Components** | shadcn/ui | Latest |
| **Data Fetching** | TanStack Query | 5.83.0 |
| **Roteamento** | React Router DOM | 6.30.1 |
| **Forms** | React Hook Form + Zod | 7.61.1 / 3.25.76 |
| **Backend** | Supabase (PostgreSQL + Auth) | 2.89.0 |
| **Gráficos** | Recharts | 2.15.4 |
| **Animações** | canvas-confetti | 1.9.4 |
| **Drag & Drop** | @hello-pangea/dnd | 18.0.1 |

---

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── ui/                 # shadcn/ui components (50+ arquivos)
│   ├── home/               # Dashboard cards
│   │   ├── LevelProgressCard.tsx      # XP e nível do usuário
│   │   ├── WeeklyProgressCard.tsx     # Resumo semanal
│   │   ├── GoalsSummaryCard.tsx       # Metas com quick check-in
│   │   ├── ProgressReportCard.tsx     # Gráficos + PDF export
│   │   └── AchievementsShowcase.tsx   # Conquistas
│   ├── goals/              # Componentes de metas
│   │   ├── GoalCard.tsx
│   │   ├── GoalModal.tsx
│   │   ├── GoalProgressChart.tsx
│   │   ├── GoalAlertsPanel.tsx        # Sistema de alertas
│   │   ├── LinkedHabitInfo.tsx
│   │   └── ProgressModal.tsx
│   ├── habits/             # Componentes de hábitos
│   │   ├── HabitCard.tsx
│   │   ├── HabitModal.tsx
│   │   ├── HabitStats.tsx
│   │   ├── HabitsList.tsx
│   │   ├── TodayHabitsCard.tsx
│   │   └── AchievementsBadges.tsx
│   ├── tasks/              # Componentes de tarefas (Kanban)
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx
│   │   ├── TaskCard.tsx
│   │   └── TaskModal.tsx
│   ├── finance/            # Módulo financeiro
│   │   ├── FinanceSummary.tsx
│   │   ├── TransactionCard.tsx
│   │   ├── TransactionModal.tsx
│   │   ├── FinanceHomeCard.tsx
│   │   └── FinanceGoalsSyncCard.tsx   # Sync finanças → metas
│   └── stats/              # Estatísticas
│       ├── GoalStats.tsx
│       ├── TaskStats.tsx
│       ├── FinanceStats.tsx
│       └── AnnualEvolutionChart.tsx
├── hooks/
│   ├── useAuth.tsx         # Autenticação
│   ├── useTenant.tsx       # Multi-tenancy (org_id)
│   ├── useHabits.tsx       # CRUD hábitos
│   ├── useGoals.tsx        # CRUD metas
│   ├── useTasks.tsx        # CRUD tarefas
│   ├── useFinance.tsx      # CRUD finanças
│   ├── useGamification.tsx # Sistema de XP e níveis
│   ├── useAchievements.ts  # Conquistas
│   ├── useGoalAlerts.tsx   # Alertas de deadlines
│   ├── useCelebration.tsx  # Animação confetti
│   ├── useFinanceGoalsSync.tsx  # Sync finanças → metas
│   ├── useGoalIntegrations.tsx  # Integrações de metas
│   ├── useHabitReminders.ts     # Lembretes de hábitos
│   └── useNotifications.ts      # Push notifications
├── services/
│   ├── habits.ts           # API hábitos
│   ├── goals.ts            # API metas
│   ├── tasks.ts            # API tarefas
│   ├── finance.ts          # API finanças
│   ├── profile.ts          # API perfil
│   ├── achievements.ts     # API conquistas
│   └── userSettings.ts     # API configurações
├── pages/
│   ├── app/
│   │   ├── Home.tsx        # Dashboard principal
│   │   ├── Goals.tsx       # Gestão de metas
│   │   ├── Habits.tsx      # Gestão de hábitos
│   │   ├── Tasks.tsx       # Kanban de tarefas
│   │   ├── Finance.tsx     # Controle financeiro
│   │   ├── Calendar.tsx    # Calendário
│   │   ├── Statistics.tsx  # Estatísticas gerais
│   │   ├── Profile.tsx     # Perfil do usuário
│   │   └── Settings.tsx    # Configurações
│   ├── Login.tsx
│   ├── Signup.tsx
│   └── NotFound.tsx
├── types/
│   ├── goals.ts
│   ├── habits.ts
│   ├── tasks.ts
│   ├── finance.ts
│   ├── gamification.ts     # XP, níveis, rewards
│   └── achievements.ts
├── layouts/
│   └── AppLayout.tsx       # Layout com sidebar
└── lib/
    ├── supabase.ts         # Cliente Supabase
    ├── env.ts              # Validação de env vars
    └── utils.ts            # Utilitários (cn, etc.)
```

---
