
-- MIGRATION_0030_whatsapp_codes.sql
-- Description: Temporary verification codes for WhatsApp linking
-- Created at: 2025-12-30

CREATE TABLE IF NOT EXISTS public.whatsapp_verification_codes (
    code text NOT NULL, -- The 6-digit code (e.g. '123456')
    user_id uuid NOT NULL DEFAULT auth.uid(),
    org_id uuid NOT NULL, -- Optional context
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    
    CONSTRAINT whatsapp_verification_codes_pkey PRIMARY KEY (code)
);

-- RLS
ALTER TABLE public.whatsapp_verification_codes ENABLE ROW LEVEL SECURITY;

-- Users can insert their own codes
DROP POLICY IF EXISTS "Users create own codes" ON public.whatsapp_verification_codes;
CREATE POLICY "Users create own codes" ON public.whatsapp_verification_codes
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can view their own codes (to display in UI)
DROP POLICY IF EXISTS "Users view own codes" ON public.whatsapp_verification_codes;
CREATE POLICY "Users view own codes" ON public.whatsapp_verification_codes
    FOR SELECT USING (user_id = auth.uid());
    
-- Service role (Edge Function) needs full access to verify/delete
-- Default service role bypasses RLS, so we are good.

-- Function to clean up old codes (optional, can be done in application logic or cron)
-- For now we will just verify expiration in the Edge Function.
