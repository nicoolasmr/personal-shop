-- =============================================================================
-- VIDA360 Migration 0008_1: Schema Migrations Tracking
-- Cria tabela para rastrear migrations aplicadas (source of truth)
-- =============================================================================

-- =============================================================================
-- PART 1: TABELA schema_migrations
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.schema_migrations (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checksum TEXT NULL,
  applied_by TEXT NULL DEFAULT current_user,
  notes TEXT NULL
);

-- Índice para buscas por filename
CREATE INDEX IF NOT EXISTS schema_migrations_filename_idx ON public.schema_migrations(filename);

-- Índice para ordenação por data
CREATE INDEX IF NOT EXISTS schema_migrations_applied_at_idx ON public.schema_migrations(applied_at DESC);

-- Comentário na tabela
COMMENT ON TABLE public.schema_migrations IS 'Rastreia migrations SQL aplicadas no banco. Source of truth para estado do schema.';
COMMENT ON COLUMN public.schema_migrations.filename IS 'Nome do arquivo de migration (ex: MIGRATION_0008_goals.sql)';
COMMENT ON COLUMN public.schema_migrations.applied_at IS 'Timestamp de quando a migration foi aplicada';
COMMENT ON COLUMN public.schema_migrations.checksum IS 'Hash MD5 opcional do conteúdo do arquivo para validação';
COMMENT ON COLUMN public.schema_migrations.applied_by IS 'Usuário/role que aplicou a migration';
COMMENT ON COLUMN public.schema_migrations.notes IS 'Notas adicionais sobre a aplicação';

-- =============================================================================
-- PART 2: REGISTRAR MIGRATIONS JÁ APLICADAS
-- =============================================================================

-- Inserir todas as migrations anteriores como já aplicadas
-- (ajustar conforme o estado real do seu banco)

INSERT INTO public.schema_migrations (filename, applied_at, notes) VALUES
  ('MIGRATION_0001.sql', NOW() - INTERVAL '30 days', 'Base: orgs, profiles, memberships, user_roles, audit_log'),
  ('MIGRATION_0002_habits.sql', NOW() - INTERVAL '25 days', 'Habits + habit_checkins + RLS'),
  ('MIGRATION_0002_1_hotfix_habits.sql', NOW() - INTERVAL '24 days', 'Hotfix: RLS checkins INSERT ownership'),
  ('MIGRATION_0002_2_hotfix_habit_checkins_update_delete.sql', NOW() - INTERVAL '24 days', 'Hotfix: RLS checkins UPDATE/DELETE'),
  ('MIGRATION_0003_weekly_goal.sql', NOW() - INTERVAL '20 days', 'Adiciona weekly_goal a habits'),
  ('MIGRATION_0003_tasks.sql', NOW() - INTERVAL '20 days', 'Tasks + task_subtasks + RLS'),
  ('MIGRATION_0003_1_hotfix_tasks.sql', NOW() - INTERVAL '19 days', 'Hotfix: RLS subtasks + reindex function'),
  ('MIGRATION_0004_task_attachments.sql', NOW() - INTERVAL '15 days', 'Task attachments + storage bucket'),
  ('MIGRATION_0005_avatar.sql', NOW() - INTERVAL '12 days', 'Avatar storage bucket'),
  ('MIGRATION_0006_habit_reminders.sql', NOW() - INTERVAL '10 days', 'Habit reminders'),
  ('MIGRATION_0007_user_settings_achievements.sql', NOW() - INTERVAL '7 days', 'User settings + achievements'),
  ('MIGRATION_0008_goals.sql', NOW(), 'Sprint 3.0: Goals module com goal_progress e trigger')
ON CONFLICT (filename) DO NOTHING;

-- =============================================================================
-- PART 3: RLS POLICIES (Apenas admins podem ver/modificar)
-- =============================================================================

-- Não habilitar RLS em schema_migrations - é uma tabela de sistema
-- Acesso controlado por roles do Postgres

-- =============================================================================
-- PART 4: HELPER FUNCTION PARA VERIFICAR MIGRATION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_migration_applied(p_filename TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.schema_migrations WHERE filename = p_filename
  );
$$;

COMMENT ON FUNCTION public.is_migration_applied IS 'Verifica se uma migration específica foi aplicada';
