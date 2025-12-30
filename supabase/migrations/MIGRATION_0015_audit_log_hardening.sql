-- =============================================================================
-- MIGRATION 0015: Audit Log Hardening
-- Security Hotfix 3.3.1 - Enhanced Visibility & Performance
-- =============================================================================
-- Improves audit_log table with meta column and indexes for faster forensics
-- =============================================================================

-- ============================================
-- 1. Update audit_log schema
-- ============================================

-- Add meta column for structured data if not exists
ALTER TABLE public.audit_log 
ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;

-- Add request_id for correlation (optional, depends on infra)
ALTER TABLE public.audit_log 
ADD COLUMN IF NOT EXISTS request_id TEXT;

-- ============================================
-- 2. Performance Indexes
-- ============================================

-- Fast search by table and record
CREATE INDEX IF NOT EXISTS audit_log_entity_idx 
  ON public.audit_log (table_name, record_id);

-- GIN index for JSONB meta search
CREATE INDEX IF NOT EXISTS audit_log_meta_gin_idx 
  ON public.audit_log USING GIN (meta);

-- User activity timeline
CREATE INDEX IF NOT EXISTS audit_log_user_timeline_idx 
  ON public.audit_log (user_id, created_at DESC);

-- ============================================
-- 3. Cleanup Policy (Retention)
-- ============================================
-- Note: Retention logic usually belongs to a worker/cron, 
-- but we define the policy here. 
-- Keep logs for 90 days for Beta.

COMMENT ON TABLE public.audit_log IS 'Log de auditoria para ações críticas. Retenção recomendada: 90 dias.';

-- ============================================
-- 4. Register migration
-- ============================================
INSERT INTO public.schema_migrations (filename, checksum)
VALUES ('MIGRATION_0015_audit_log_hardening.sql', 'hotfix_3_3_1_audit_log')
ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum;
