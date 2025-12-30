-- VIDA360: Task Attachments Migration
-- Run this in your Supabase SQL Editor
-- ===========================================================================

-- ===========================================================================
-- PART 1: CREATE STORAGE BUCKET FOR TASK ATTACHMENTS
-- ===========================================================================

-- Create the storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments',
  'task-attachments',
  true,  -- Public bucket for easy access
  10485760,  -- 10MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'text/csv']
);

-- ===========================================================================
-- PART 2: CREATE task_attachments TABLE
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================================================
-- PART 3: RLS POLICIES FOR task_attachments
-- ===========================================================================

ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view attachments of their tasks
CREATE POLICY "Users can view task attachments"
  ON public.task_attachments
  FOR SELECT
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id)
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
        AND t.org_id = task_attachments.org_id
        AND t.user_id = auth.uid()
    )
  );

-- INSERT: Users can add attachments to their own tasks
CREATE POLICY "Users can add task attachments"
  ON public.task_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_member(auth.uid(), org_id)
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
        AND t.org_id = task_attachments.org_id
        AND t.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete their own attachments
CREATE POLICY "Users can delete their own attachments"
  ON public.task_attachments
  FOR DELETE
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), org_id)
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
        AND t.org_id = task_attachments.org_id
        AND t.user_id = auth.uid()
    )
  );

-- ===========================================================================
-- PART 4: STORAGE RLS POLICIES
-- ===========================================================================

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload task attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'task-attachments');

-- Allow authenticated users to view files
CREATE POLICY "Users can view task attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'task-attachments');

-- Allow authenticated users to delete their files
CREATE POLICY "Users can delete their own task attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ===========================================================================
-- PART 5: INDEX FOR PERFORMANCE
-- ===========================================================================

CREATE INDEX IF NOT EXISTS task_attachments_task_id_idx ON public.task_attachments(task_id);
CREATE INDEX IF NOT EXISTS task_attachments_org_user_idx ON public.task_attachments(org_id, user_id);
