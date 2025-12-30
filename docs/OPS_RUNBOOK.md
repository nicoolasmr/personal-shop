
# OPS CONSOLE RUNBOOK (V1.0)
Authored by: Antigravity AI
Date: 2025-12-30

## 1. Overview
The Ops Console is a restricted-access portal for managing the VIDA360 platform. It provides tools for user management, system diagnostics, bug tracking, and financial oversight without exposing direct database access or PII unnecessarily.

**Access URL**: `/ops`
**Required Permission**: `ops_users_read` (minimum), `admin` (full access).

---

## 2. Modules & Capabilities

### 2.1 User Management (`/ops/users`)
**Purpose**: View user base health and handle account moderation.
- **Capabilities**:
    - List recent users (paginated).
    - **PII Masking**: Emails/Phones are masked (e.g. `n***@gmail.com`) by default.
    - **Actions**:
        - `Disable`: Instantly bans specific user access (100-year ban).
        - `Enable`: Restores access.
- **SOP - Banning a User**:
    1. Confirm user ID from report or database.
    2. Click "Disable".
    3. Action is logged in `ops_audit_log`.

### 2.2 Team Access (`/ops/team`)
**Purpose**: Promote or demote staff members. **ADMIN ONLY**.
- **Capabilities**:
    - Change role of a target User ID to `user`, `team`, or `admin`.
- **Warning**: Promoting to `admin` grants full destruction capabilities. Use extremely sparingly.

### 2.3 Diagnostics (`/ops/diagnostics`)
**Purpose**: View system integrity events and high-level errors.
- **Capabilities**:
    - Real-time feed of system events (severity: `info`, `warning`, `error`, `critical`).
    - Audit log visualization (implied).

### 2.4 Bug Reports (`/ops/bugs`)
**Purpose**: Triage user-submitted tickets.
- **Capabilities**:
    - View sanitized bug reports.
    - Check route/severity of issues.

### 2.5 Billing (`/ops/billing`)
**Purpose**: High-level financial pulse.
- **Metrics**:
    - **Est. MRR (30d)**: Rolling 30-day confirmed income.
    - **Lifetime Revenue**: Total income all-time.
    - **Volume (24h)**: Transaction velocity.
- **Note**: Data is cached/aggregated; may have slight delay vs Stripe dashboard.

### 2.6 Feature Flags (`/ops/flags`)
**Purpose**: Toggle system features in real-time.
- **Critical Flags**:
    - `admin_console_enabled`: **Killswitch** for this entire console. If set to `false`, you lock yourself out (unless you have DB access to restore).
    - `maintenance_mode`: Puts customer app in read-only mode.
    - `signup_enabled`: Stops new user influx during attacks.
- **SOP - Rolling out a Feature**:
    1. Default flag to `false` in DB.
    2. Deploy code.
    3. Toggle to `true` in `/ops/flags` to activate.

---

## 3. Incident Response Protocol

### Severity Levels
- **SEV-1 (Critical)**: Site down, Data loss, Security Breach.
    - **Action**: Activate `maintenance_mode` immediately via Flags. Notify CTO. Access localized DB backups.
- **SEV-2 (High)**: Core flow broken (e.g. Payments failing, Login failing).
    - **Action**: Check `Diagnostics`. If feature-related, toggle off relevant Flag.
- **SEV-3 (Moderate)**: Minor bug, UI glitch.
    - **Action**: File ticket in `Bugs`.

### Security Breach (Account Compromise)
1. Navigate to `/ops/users`.
2. Locate compromised User ID.
3. Click `Disable`.
4. If Admin account compromised: Use SQL access to revoke role manually immediately.

---

## 4. Audit & Compliance
- Every state change (Flag toggle, User ban, Role change) is logged to `public.ops_audit_log`.
- PII is strictly handled according to `docs/DATA_CLASSIFICATION.md`.
- **NEVER** share Ops credentials.
