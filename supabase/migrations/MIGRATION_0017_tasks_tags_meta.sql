-- =============================================================================
-- MIGRATION 0017: Tasks Tags and Meta JSONB
-- Sprint 3.2.1 - Task Flexibility
-- =============================================================================
-- Adds Tags (TEXT array) and Meta (JSONB) to tasks for extensibility
-- =============================================================================

-- ============================================
-- 1. Updates tasks table
-- ============================================

-- Add tags and meta columns
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::JSONB;

-- Performance: GIN indexes for array and jsonb search
CREATE INDEX IF NOT EXISTS tasks_tags_gin_idx ON public.tasks USING GIN (tags);
CREATE INDEX IF NOT EXISTS tasks_meta_gin_idx ON public.tasks USING GIN (meta);

-- ============================================
-- 2. Register migration
-- ============================================
INSERT INTO public.schema_migrations (filename, checksum)
VALUES ('MIGRATION_0017_tasks_tags_meta.sql', 'sprint_3_2_1_task_ext')
ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum;
