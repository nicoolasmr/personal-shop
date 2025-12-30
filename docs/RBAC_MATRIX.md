# RBAC Matrix & Permissions

## Roles

The application uses the following roles (enum `app_role`):

1.  **`user`**: Standard end-user. Access to `/app` (personal data only). No access to `/ops`.
2.  **`team`**: Operational support staff. Access to `/ops`.
    *   Can view user lists (masked PII).
    *   Can manage bug reports and diagnostics.
    *   Cannot promote/demote users to/from `team`/`admin`.
    *   Cannot export sensitive financial data relative to specific users (only aggregates if permitted).
3.  **`admin`**: Superuser. Access to `/ops`.
    *   Full access to all `/ops` features.
    *   Can manage `team` permissions.
    *   Can view/export global billing data.
    *   **Restriction:** Even admins should not view raw user PII (e.g., chat content, personal notes) unless explicitly required and audited for support (currently DENY by default).

## Permissions (Granular)

| Permission Token | Description | Roles (Default) |
| :--- | :--- | :--- |
| `ops.users.read` | View list of users (metadata only, masked PII). | `team`, `admin` |
| `ops.users.create` | Create new standard users. | `team`, `admin` |
| `ops.users.disable` | Disable/Ban a standard user. | `team`, `admin` |
| `ops.users.roles.assign_user_only` | Allow assigning `user` role only (cannot promote to team). | `team` |
| `ops.diagnostics.view` | View system health and diagnostic logs. | `team`, `admin` |
| `ops.bugs.view` | View bug reports. | `team`, `admin` |
| `ops.bugs.manage` | Update status of bug reports. | `team`, `admin` |
| `ops.billing.view` | View aggregated billing metrics. | `admin` |
| `ops.billing.export` | Export billing data (CSV). | `admin` |
| `ops.platform.health` | View detailed platform health metrics. | `team`, `admin` |
| `ops.team.permissions.manage` | Manage roles and permissions of other staff. | `admin` |

## Enforcement

*   **Frontend**: `OpsGuard` checks for `admin_console_enabled` flag AND user role (`team` OR `admin`).
*   **Backend**: RLS policies and Edge Functions must verify specific permissions (e.g., `has_permission('ops.billing.view')`).
