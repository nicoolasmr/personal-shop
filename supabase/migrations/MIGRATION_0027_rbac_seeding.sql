
-- MIGRATION_0027_rbac_seeding.sql
-- Description: Seeds the initial permissions for Team and Admin roles.
-- Run this AFTER executing MIGRATION_0023 successfully.

INSERT INTO public.role_permissions (role, permission) VALUES
-- TEAM Permissions
('team', 'ops_users_read'),
('team', 'ops_users_create'),
('team', 'ops_users_disable'),
('team', 'ops_users_roles_assign_user_only'),
('team', 'ops_diagnostics_view'),
('team', 'ops_bugs_view'),
('team', 'ops_bugs_manage'),
('team', 'ops_platform_health'),

-- ADMIN Permissions
('admin', 'ops_users_read'),
('admin', 'ops_users_create'),
('admin', 'ops_users_disable'),
('admin', 'ops_users_roles_assign_user_only'),
('admin', 'ops_diagnostics_view'),
('admin', 'ops_bugs_view'),
('admin', 'ops_bugs_manage'),
('admin', 'ops_billing_view'),
('admin', 'ops_billing_export'),
('admin', 'ops_platform_health'),
('admin', 'ops_team_permissions_manage')
ON CONFLICT (role, permission) DO NOTHING;
