# VIDA360 Architecture

## Overview

VIDA360 is a multi-tenant personal productivity platform built with modern web technologies. It integrates Tasks, Habits, Goals, Finance, and Calendar management into a unified experience.

## Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend                            │
│  React 18 + TypeScript + Vite + Tailwind CSS           │
│  TanStack Query (data fetching) + React Router          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Supabase Backend                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Auth      │  │  PostgreSQL  │  │   Storage    │  │
│  │  (GoTrue)    │  │   + RLS      │  │   (S3-like)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Edge Functions (Deno)                │  │
│  │  /health - System healthcheck                     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Multi-Tenant Architecture

VIDA360 uses a **shared database, shared schema** multi-tenant model where data isolation is enforced at the row level.

### Core Entities

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│    orgs     │◄──────│ memberships  │──────►│  profiles   │
│  (tenants)  │       │              │       │   (users)   │
└─────────────┘       └──────────────┘       └─────────────┘
      │                                             │
      │                                             │
      ▼                                             ▼
┌─────────────┐                            ┌─────────────┐
│ user_roles  │                            │  auth.users │
│             │                            │  (Supabase) │
└─────────────┘                            └─────────────┘
```

### Entity Descriptions

| Table | Purpose |
|-------|---------|
| `orgs` | Organizations/tenants. Each org is isolated. |
| `profiles` | Extended user profile linked to `auth.users`. |
| `memberships` | Links users to organizations with roles. |
| `user_roles` | Role assignments (owner, admin, member). |
| `audit_log` | Immutable audit trail for compliance. |

### Resolving `org_id`

The current organization context is resolved through:

1. **TenantProvider** (`src/hooks/useTenant.tsx`) fetches the user's profile and primary org
2. All data queries include `org_id` in WHERE clauses
3. RLS policies enforce `org_id` matches the user's membership

```typescript
// Example: Using tenant context
const { org } = useTenant();
const { data } = useQuery({
  queryKey: ['habits', org?.id],
  queryFn: () => fetchHabits(org!.id),
  enabled: !!org
});
```

## Row Level Security (RLS)

**RLS is mandatory** for all user-facing tables. This ensures data isolation at the database level.

### RLS Policy Patterns

```sql
-- Read: Users can only see data from their orgs
CREATE POLICY "Users can read own org data" ON habits
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Write: Users can only create/update in their orgs
CREATE POLICY "Users can insert in own org" ON habits
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );
```

### Why RLS is Required

1. **Defense in depth**: Even if frontend code has bugs, data stays protected
2. **Multi-tenant safety**: Impossible to accidentally leak data across orgs
3. **Audit compliance**: Database-level access control for compliance requirements

## Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Login   │────►│ Supabase │────►│  Session │────►│AuthGuard │
│   Page   │     │   Auth   │     │  Created │     │ Redirect │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                        │
                                        ▼
                                 ┌──────────┐
                                 │ /app/*   │
                                 │  Routes  │
                                 └──────────┘
```

### Auth Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `AuthProvider` | `src/hooks/useAuth.tsx` | Manages auth state globally |
| `AuthGuard` | `src/components/AuthGuard.tsx` | Protects routes, redirects to login |
| `TenantProvider` | `src/hooks/useTenant.tsx` | Provides org/profile context |

## Route Structure

### Public Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Redirect | Redirects to `/login` |
| `/login` | `Login.tsx` | Authentication page |
| `/signup` | `Signup.tsx` | Registration page |
| `/cadastro` | Redirect | Alias for `/signup` (PT-BR) |

### Protected Routes (`/app/*`)

All routes under `/app` require authentication via `AuthGuard`.

| Route | Component | Description |
|-------|-----------|-------------|
| `/app/home` | `Home.tsx` | Dashboard with summary cards |
| `/app/tasks` | `Tasks.tsx` | Task management |
| `/app/habits` | `Habits.tsx` | Habit tracking |
| `/app/goals` | `Goals.tsx` | Goal management |
| `/app/finance` | `Finance.tsx` | Financial control |
| `/app/calendar` | `Calendar.tsx` | Calendar/agenda |
| `/app/profile` | `Profile.tsx` | User profile |
| `/app/settings` | `Settings.tsx` | App settings |

### API Routes (Edge Functions)

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/functions/v1/health` | GET | No | System healthcheck |

## Audit Logging

The `audit_log` table provides an immutable record of sensitive operations.

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES orgs(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Logged Actions

- User login/logout
- Role changes
- Membership modifications
- Sensitive data access
- Configuration changes

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                        │
│              (Ingress / Cloud LB)                       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Kubernetes Cluster                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │              vida360-app Pods                    │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐         │   │
│  │  │ nginx   │  │ nginx   │  │ nginx   │         │   │
│  │  │ :80     │  │ :80     │  │ :80     │         │   │
│  │  └─────────┘  └─────────┘  └─────────┘         │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Supabase Cloud                         │
│    (Auth + Database + Storage + Edge Functions)         │
└─────────────────────────────────────────────────────────┘
```

## Future Roadmap

### Planned Integrations

| Integration | Purpose | Status |
|------------|---------|--------|
| WhatsApp | Notifications & reminders | 🔮 Planned |
| Google Calendar | Two-way sync | 🔮 Planned |
| Open Finance | Bank account sync | 🔮 Planned |
| Apple Health | Habit data import | 🔮 Planned |

### Upcoming Features

- **Sprint 1**: Habits CRUD + Daily check-ins + RLS
- **Sprint 2**: Tasks with priorities and due dates
- **Sprint 3**: Goals with progress tracking
- **Sprint 4**: Finance basic tracking
- **Sprint 5**: Calendar integration

## Security Considerations

1. **No secrets in code**: All credentials via environment variables
2. **RLS everywhere**: Database-level access control
3. **JWT validation**: All protected routes require valid session
4. **Audit logging**: Compliance-ready activity tracking
5. **CORS configured**: Proper origin restrictions

## Environment Variables

See `.env.example` for the complete list of required variables.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
