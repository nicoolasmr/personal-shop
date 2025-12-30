-- =============================================================================
-- MIGRATION 0012: Storage Hardening - Bucket Policies
-- Hotfix 3.3.2 - Security improvements for avatars and task-attachments
-- =============================================================================
-- Path pattern enforcement:
--   avatars: {user_id}/avatar.{ext}
--   task-attachments: {org_id}/{task_id}/{attachment_id}.{ext}
-- =============================================================================

-- ============================================
-- 1. Drop existing permissive policies
-- ============================================

-- Avatars bucket
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;

-- Task attachments bucket  
DROP POLICY IF EXISTS "Users can upload task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own task attachments" ON storage.objects;

-- ============================================
-- 2. AVATARS BUCKET - Strict path policies
-- Path: {user_id}/filename.ext
-- ============================================

-- INSERT: Only own folder (user_id must match first folder)
CREATE POLICY "avatars_insert_own_folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: Only own folder
CREATE POLICY "avatars_update_own_folder"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: Only own folder
CREATE POLICY "avatars_delete_own_folder"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT: Public read for avatars (needed for profile display)
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- ============================================
-- 3. TASK-ATTACHMENTS BUCKET - Org-scoped policies
-- Path: {org_id}/{task_id}/{filename}
-- ============================================

-- INSERT: Only to own org folder + must own the task
CREATE POLICY "task_attachments_insert_own_org"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = public.get_user_org_id()::text
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id::text = (storage.foldername(name))[2]
        AND t.user_id = auth.uid()
        AND t.org_id = public.get_user_org_id()
    )
  );

-- SELECT: Only files in own org folder
CREATE POLICY "task_attachments_select_own_org"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = public.get_user_org_id()::text
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id::text = (storage.foldername(name))[2]
        AND t.user_id = auth.uid()
        AND t.org_id = public.get_user_org_id()
    )
  );

-- UPDATE: Only files in own org + own task
CREATE POLICY "task_attachments_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = public.get_user_org_id()::text
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id::text = (storage.foldername(name))[2]
        AND t.user_id = auth.uid()
        AND t.org_id = public.get_user_org_id()
    )
  )
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = public.get_user_org_id()::text
  );

-- DELETE: Only own files
CREATE POLICY "task_attachments_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = public.get_user_org_id()::text
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id::text = (storage.foldername(name))[2]
        AND t.user_id = auth.uid()
        AND t.org_id = public.get_user_org_id()
    )
  );

-- ============================================
-- 4. Register migration
-- ============================================
INSERT INTO public.schema_migrations (filename, checksum)
VALUES ('MIGRATION_0012_storage_hardening.sql', 'hotfix_3_3_2_storage')
ON CONFLICT (filename) DO UPDATE SET checksum = EXCLUDED.checksum;
