-- Migration: Goal Finance Sync
-- Description: Consolidated sync logic is in MIGRATION_0011 and MIGRATION_0013
-- This file ensures the tracking is consistent.

-- Record as applied
INSERT INTO public.schema_migrations (filename, checksum)
VALUES ('MIGRATION_0016_goal_finance_sync.sql', 'consolidated_in_0011_0013')
ON CONFLICT (filename) DO NOTHING;
