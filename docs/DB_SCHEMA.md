# Database Schema

## Tables

### orgs
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Organization ID |
| name | text | Organization name |
| created_at | timestamptz | Creation timestamp |

### profiles
| Column | Type | Description |
|--------|------|-------------|
| user_id | uuid (PK, FK auth.users) | User ID |
| org_id | uuid (FK orgs) | Organization ID |
| full_name | text | User's full name |
| email | text | User email |
| created_at | timestamptz | Creation timestamp |

### memberships
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Membership ID |
| org_id | uuid (FK orgs) | Organization ID |
| user_id | uuid | User ID |
| role | app_role | owner/admin/member |
| created_at | timestamptz | Creation timestamp |

### user_roles
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Role ID |
| user_id | uuid (FK auth.users) | User ID |
| role | app_role | User role |

### audit_log
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Log ID |
| org_id | uuid | Organization ID |
| user_id | uuid | User ID |
| action | text | Action performed |
| entity_type | text | Entity type |
| entity_id | uuid | Entity ID |
| meta | jsonb | Additional metadata |
| created_at | timestamptz | Timestamp |

### habits (Sprint 1)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Habit ID |
| org_id | uuid (FK orgs) | Organization ID |
| user_id | uuid (FK auth.users) | Creator/owner |
| name | text | Habit name (required) |
| description | text | Optional description |
| category | text | Category |
| frequency | jsonb | `{ "type": "daily" | "weekly" }` |
| target | int | Times per period (default: 1) |
| color | text | Hex color |
| active | boolean | Soft-delete flag |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

**Indexes:**
- `habits_org_id_idx` ON (org_id)
- `habits_user_id_idx` ON (user_id)
- `habits_active_idx` ON (active)
- `habits_created_at_idx` ON (created_at DESC)

### habit_checkins (Sprint 1)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Checkin ID |
| org_id | uuid (FK orgs) | Organization ID |
| habit_id | uuid (FK habits) | Parent habit |
| user_id | uuid (FK auth.users) | User who checked in |
| checkin_date | date | Date of check-in |
| completed | boolean | Completion status |
| notes | text | Optional notes |
| source | text | 'app' or 'whatsapp' |
| created_at | timestamptz | Creation timestamp |

**Constraints:**
- `habit_checkins_unique_day` UNIQUE (habit_id, checkin_date)

**Indexes:**
- `habit_checkins_org_id_idx` ON (org_id)
- `habit_checkins_habit_id_idx` ON (habit_id)
- `habit_checkins_user_date_idx` ON (user_id, checkin_date)
- `habit_checkins_date_idx` ON (checkin_date DESC)

## RLS Policies

All tables have RLS enabled. Users can only access data within their organization.

### habits Policies
| Operation | Rule |
|-----------|------|
| SELECT | User is member of org |
| INSERT | User is member of org AND user_id = auth.uid() |
| UPDATE | User is member of org AND user_id = auth.uid() |
| DELETE | User is member of org AND user_id = auth.uid() |

### habit_checkins Policies
| Operation | Rule |
|-----------|------|
| SELECT | User is member of org |
| INSERT | User is member of org AND user_id = auth.uid() |
| UPDATE | User is member of org AND user_id = auth.uid() |
| DELETE | User is member of org AND user_id = auth.uid() |

### goals (Sprint 3.0)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Goal ID |
| org_id | uuid (FK orgs) | Organization ID |
| user_id | uuid (FK auth.users) | Owner |
| type | text | custom, financial, habit, task, reading, weight, exercise, savings, study, health |
| title | text | Goal title |
| description | text | Optional description |
| target_value | numeric | Target value (e.g., 5000) |
| current_value | numeric | **Derived via trigger** - sum of goal_progress |
| unit | text | Unit of measure (R$, kg, pages) |
| due_date | date | Optional deadline |
| status | text | active, done, archived |
| linked_habit_id | uuid (FK habits) | Optional habit integration |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

**Important:** `current_value` is automatically calculated by the `on_goal_progress_change` trigger. Never update it directly.

**Indexes:**
- `goals_org_id_idx` ON (org_id)
- `goals_user_id_idx` ON (user_id)
- `goals_status_idx` ON (status)
- `goals_type_idx` ON (type)
- `goals_org_user_idx` ON (org_id, user_id)
- `goals_active_due_date_idx` ON (org_id, due_date) WHERE status = 'active'

### goal_progress (Sprint 3.0)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Progress ID |
| org_id | uuid (FK orgs) | Organization ID |
| goal_id | uuid (FK goals) | Parent goal |
| user_id | uuid (FK auth.users) | Who recorded it |
| progress_date | date | Date of progress |
| delta_value | numeric | Incremental value (+/-) |
| notes | text | Optional notes |
| source | text | 'app', 'whatsapp', 'integration' |
| created_at | timestamptz | Creation timestamp |

**Indexes:**
- `goal_progress_org_id_idx` ON (org_id)
- `goal_progress_goal_id_idx` ON (goal_id)
- `goal_progress_goal_date_idx` ON (goal_id, progress_date DESC)
- `goal_progress_org_goal_idx` ON (org_id, goal_id)

### schema_migrations (Sprint 3.0.1)
| Column | Type | Description |
|--------|------|-------------|
| id | bigserial (PK) | Migration ID |
| filename | text (UNIQUE) | Migration file name |
| applied_at | timestamptz | When migration was applied |
| checksum | text | Optional MD5 hash |
| applied_by | text | User/role who applied |
| notes | text | Additional notes |

### transaction_categories (Sprint 3.1)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Category ID |
| org_id | uuid (FK orgs) | Organization ID |
| user_id | uuid (FK auth.users) | User who created |
| name | text | Category name |
| type | text | 'income' or 'expense' |
| icon | text | Emoji/icon |
| color | text | Hex color |
| is_default | boolean | System default category |
| created_at | timestamptz | Creation timestamp |

### transactions (Sprint 3.1)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Transaction ID |
| org_id | uuid (FK orgs) | Organization ID |
| user_id | uuid (FK auth.users) | User who created |
| type | text | 'income' or 'expense' |
| amount | numeric | Transaction amount |
| description | text | Description |
| category_id | uuid (FK transaction_categories) | Category |
| transaction_date | date | Date of transaction |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### push_subscriptions (Sprint 3.4)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Subscription ID |
| org_id | uuid (FK orgs) | Organization ID |
| user_id | uuid (FK auth.users) | User ID |
| endpoint | text (UNIQUE) | Push endpoint URL |
| p256dh | text | Encryption public key |
| auth | text | Auth secret |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

**RLS Policies (push_subscriptions):**
| Operation | Rule |
|-----------|------|
| SELECT | org_id matches user's org |
| INSERT | org_id matches + user_id = auth.uid() |
| UPDATE | org_id matches + user_id = auth.uid() |
| DELETE | org_id matches + user_id = auth.uid() |

## Triggers

### on_goal_progress_change
- **Table:** goal_progress
- **Events:** AFTER INSERT, UPDATE, DELETE
- **Function:** update_goal_current_value()
- **Purpose:** Recalculates `goals.current_value` by summing all `delta_value` for the affected goal_id
- **Handles:** INSERT, UPDATE (including goal_id change), DELETE

### on_transaction_change (Sprint 3.4)
- **Table:** transactions
- **Events:** AFTER INSERT, UPDATE, DELETE
- **Function:** sync_financial_goals()
- **Purpose:** Updates financial goals (type='financial'/'savings') when transactions change

## Helper Functions

### is_org_member(user_id, org_id)
Security definer function to check org membership without recursion.

### is_migration_applied(filename)
Returns boolean indicating if a specific migration has been applied.

### get_user_org_id()
Security definer function to get current user's org_id from profiles.

### sync_financial_goal(goal_id, delta, month_key)
Idempotent RPC to sync financial goal progress with deduplication.
