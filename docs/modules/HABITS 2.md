# Habits Module Documentation

## Overview

The Habits module allows users to create, track, and manage daily/weekly habits with streak tracking and check-in history.

## Data Model

### habits table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| org_id | UUID | Organization (tenant) |
| user_id | UUID | Creator/owner |
| name | TEXT | Habit name (required) |
| description | TEXT | Optional description |
| category | TEXT | Category (Saúde, Fitness, etc.) |
| frequency | JSONB | `{ "type": "daily" | "weekly" }` |
| target | INT | Times per day/week (default: 1) |
| color | TEXT | Hex color for UI |
| active | BOOLEAN | Soft-delete flag |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### habit_checkins table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| org_id | UUID | Organization (tenant) |
| habit_id | UUID | Parent habit |
| user_id | UUID | User who checked in |
| checkin_date | DATE | Date of check-in |
| completed | BOOLEAN | Completion status |
| notes | TEXT | Optional notes |
| source | TEXT | 'app' or 'whatsapp' |
| created_at | TIMESTAMPTZ | Creation timestamp |

**Unique Constraint:** `(habit_id, checkin_date)` - prevents duplicate check-ins per day.

## Frequency Model

```json
// Daily habit
{ "type": "daily" }

// Weekly habit (future: specific days)
{ "type": "weekly", "daysOfWeek": [1, 3, 5] }
```

## Check-in Toggle Logic

The toggle function uses an **upsert + invert** pattern:

```
1. Query: SELECT * FROM habit_checkins WHERE habit_id = ? AND checkin_date = ?
2. If NOT exists:
   - INSERT with completed = true
3. If exists:
   - UPDATE completed = NOT current_value
4. Log to audit_log
```

This allows users to:
- Mark a habit as complete (first click)
- Unmark it (second click)
- Re-mark it (third click)

## Streak Calculation

Streak counts consecutive days with `completed = true`, working backwards from today:

```
1. Sort checkins by date DESC, filter completed = true
2. If today is completed, start counting from today
3. If today is NOT completed, start from yesterday
4. For each checkin:
   - If date matches expected date: streak++
   - If date is before expected: break (gap found)
5. Return streak count
```

## Weekly Rate Calculation

```
weeklyRate = (checkins completed in last 7 days / 7) * 100
```

Returns percentage (0-100).

## Source Field

The `source` field tracks where the check-in originated:

| Value | Description |
|-------|-------------|
| `app` | Check-in via web/mobile app |
| `whatsapp` | Check-in via WhatsApp integration (future) |

This enables:
- Analytics on check-in sources
- WhatsApp bot integration (Sprint 3+)
- Cross-platform habit tracking

## RLS Policies

### habits

| Operation | Policy |
|-----------|--------|
| SELECT | User is member of org |
| INSERT | User is member of org AND user_id = auth.uid() |
| UPDATE | User is member of org AND user_id = auth.uid() |
| DELETE | User is member of org AND user_id = auth.uid() |

### habit_checkins

| Operation | Policy |
|-----------|--------|
| SELECT | User is member of org |
| INSERT | User is member of org AND user_id = auth.uid() AND habit exists in org |
| UPDATE | User is member of org AND user_id = auth.uid() |
| DELETE | User is member of org AND user_id = auth.uid() |

## Audit Log Events

| Action | Entity Type | Meta |
|--------|-------------|------|
| habit_created | habit | { name, category } |
| habit_updated | habit | { changes: {...} } |
| habit_archived | habit | {} |
| habit_checkin_toggled | habit_checkin | { date, completed, source } |

## UI Components

### HabitCard
- Displays habit name, category, streak, weekly rate
- 7-day grid with clickable toggles
- Edit and Archive buttons

### HabitModal
- Create/Edit form
- Fields: name, description, category, frequency, target, color
- Color picker with presets

### TodayHabitsCard
- Home page widget
- Shows X/Y progress
- Quick toggle buttons
- "Ver todos" link to /app/habits

## API Endpoints (Service Layer)

| Function | Description |
|----------|-------------|
| listHabits(orgId) | Get active habits with last 7 days of checkins |
| getHabit(orgId, habitId) | Get single habit with checkins |
| createHabit(orgId, userId, payload) | Create new habit |
| updateHabit(orgId, userId, habitId, payload) | Update habit |
| archiveHabit(orgId, userId, habitId) | Soft-delete habit |
| toggleHabitCheckin(orgId, userId, habitId, date?, source?) | Toggle check-in |
| getTodayHabitsSummary(orgId) | Get today's progress |

## Categories

Default categories:
- Saúde
- Fitness
- Produtividade
- Aprendizado
- Mindfulness
- Social
- Finanças
- Hobby
- Outro

## Colors

Default color palette:
- #ef4444 (red)
- #f97316 (orange)
- #eab308 (yellow)
- #22c55e (green)
- #14b8a6 (teal)
- #3b82f6 (blue)
- #8b5cf6 (violet)
- #ec4899 (pink)
