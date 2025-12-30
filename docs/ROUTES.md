# Routes

## Public Routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/login` |
| `/login` | Login page |
| `/signup` | Registration page |
| `/cadastro` | Redirect to `/signup` (PT-BR alias) |

## Protected Routes (`/app/*`)

All routes require authentication via `AuthGuard`.

| Route | Description | Menu Visible |
|-------|-------------|--------------|
| `/app` | Redirects to `/app/home` | - |
| `/app/home` | Dashboard with gamification, goals summary, habits of the day | ✅ |
| `/app/tasks` | Tasks management (Kanban) | ✅ |
| `/app/habits` | **REDIRECT** → `/app/goals?tab=habits` | ❌ |
| `/app/goals` | Goals + Habits management (unified) | ✅ |
| `/app/finance` | Financial control | ✅ |
| `/app/calendar` | Calendar/agenda | ✅ |
| `/app/stats` | Statistics and reports | ✅ |
| `/app/profile` | User profile | ✅ |
| `/app/settings` | App settings (push notifications, preferences) | ✅ |

> **Note (v3.4.1+)**: `/app/habits` agora redireciona para `/app/goals?tab=habits`.
> Hábitos foram integrados na página de Metas para melhor UX.
> Links antigos e bookmarks continuam funcionando via redirect.

## API Routes (Edge Functions)

| Route | Method | Auth Required | Description |
|-------|--------|---------------|-------------|
| `/functions/v1/health` | GET | No | System healthcheck |
| `/functions/v1/send-push` | POST | Yes (JWT) | Send push notifications |

### send-push Parameters

```json
{
  "user_id": "uuid",      // Optional: Target specific user
  "org_id": "uuid",       // Optional: Target all users in org
  "title": "string",      // Notification title
  "message": "string",    // Notification body
  "url": "/app/path"      // URL to open on click
}
```

## Service Layer (Frontend)

### Habits Service (`src/services/habits.ts`)

| Function | Description |
|----------|-------------|
| `listHabits(orgId)` | Get active habits with checkins |
| `createHabit(orgId, userId, payload)` | Create new habit |
| `updateHabit(orgId, userId, habitId, payload)` | Update habit |
| `archiveHabit(orgId, userId, habitId)` | Soft-delete habit |
| `toggleHabitCheckin(orgId, userId, habitId, date?, source?)` | Toggle checkin |
| `getTodayHabitsSummary(orgId)` | Get today's progress |

### Goals Service (`src/services/goals.ts`)

| Function | Description |
|----------|-------------|
| `listGoals(orgId)` | Get all goals with progress |
| `createGoal(orgId, userId, payload)` | Create new goal |
| `updateGoal(orgId, userId, goalId, payload)` | Update goal |
| `archiveGoal(orgId, userId, goalId)` | Archive goal |
| `addProgress(orgId, userId, goalId, value)` | Add progress entry |

### Push Notifications (`src/hooks/usePushNotifications.ts`)

| Function | Description |
|----------|-------------|
| `subscribe()` | Subscribe to push notifications |
| `unsubscribe()` | Unsubscribe from push |
| `toggle()` | Toggle subscription state |
| `sendTest()` | Send test notification |

## Route Protection

Protected routes are wrapped with `AuthGuard` component which:
1. Checks for valid Supabase session
2. Redirects to `/login` if not authenticated
3. Shows loading state while checking auth

## Notifications System

### Browser Notifications (Notification API)
- Requires browser to be open
- Works without VAPID keys
- Used for immediate alerts

### Push Notifications (Web Push API)
- Works with app closed/in background
- Requires VAPID keys configured
- Subscriptions stored in `push_subscriptions` table
- Edge function `send-push` for server-side delivery

See `usePushNotifications` hook and Settings page for implementation.
