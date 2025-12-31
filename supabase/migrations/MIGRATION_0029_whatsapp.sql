
-- MIGRATION_0029_whatsapp.sql
-- Description: WhatsApp Integration Tables (Privacy-First)
-- Created at: 2025-12-30

-- 1. WhatsApp Links (Identity Mapping)
-- Stores the link between a WhatsApp phone hash and a system User ID.
-- We DO NOT store the raw phone number to avoid PII leaks.
CREATE TABLE IF NOT EXISTS public.whatsapp_links (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    org_id uuid NOT NULL,
    
    -- Security / Privacy
    phone_hash text NOT NULL UNIQUE, -- SHA256(phone + SALT)
    phone_last4 text NULL,          -- UX only (e.g. "8899")
    phone_encrypted text NULL,      -- Optional: encrypted with retention key if recovery needed
    
    -- Status
    verified boolean NOT NULL DEFAULT false,
    verification_code text NULL,    -- Temporary code for strict linking flow
    verification_expires_at timestamptz NULL,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT whatsapp_links_pkey PRIMARY KEY (id),
    CONSTRAINT whatsapp_links_user_unique UNIQUE (user_id) -- One Main WhatsApp per user for now
);

-- 2. WhatsApp Message Log (Metadata Only)
-- We log execution flow but NEVER the message content text.
CREATE TABLE IF NOT EXISTS public.whatsapp_messages_log (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NULL, -- Nullable because we might log "unknown number" attempts
    org_id uuid NULL,
    
    direction text NOT NULL, -- 'in' | 'out'
    message_type text NOT NULL, -- 'text' | 'command' | 'template' | 'system'
    
    intent text NULL, -- e.g. 'ADD_EXPENSE', 'LIST_AGENDA'
    status text NOT NULL, -- 'processed' | 'rejected' | 'error'
    error_code text NULL,
    
    provider_message_id text NULL,
    created_at timestamptz DEFAULT now(),
    
    CONSTRAINT whatsapp_messages_log_pkey PRIMARY KEY (id)
);

-- 3. Conversation State (Session Memory)
-- Stores temporary state for multi-turn conversations (e.g. "What is the expense amount?")
CREATE TABLE IF NOT EXISTS public.whatsapp_conversation_state (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE, -- 1 active state per user
    phone_hash text NOT NULL,
    
    state jsonb NOT NULL DEFAULT '{}'::jsonb, -- { "current_intent": "ADD_EVENT", "draft": {...} }
    last_interaction_at timestamptz DEFAULT now(),
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT whatsapp_state_pkey PRIMARY KEY (id)
);

-- 4. Audit / Privacy Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_links_hash ON public.whatsapp_links (phone_hash);
CREATE INDEX IF NOT EXISTS idx_messages_log_user_time ON public.whatsapp_messages_log (user_id, created_at);

-- 5. RLS Policies

-- Enable RLS
ALTER TABLE public.whatsapp_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversation_state ENABLE ROW LEVEL SECURITY;

-- Policies for LINKS
-- Users can see their own link status
DROP POLICY IF EXISTS "Users view own link" ON public.whatsapp_links;
CREATE POLICY "Users view own link" ON public.whatsapp_links
    FOR SELECT USING (user_id = auth.uid());

-- Only system (service_role) creates/updates links usually, but we allow user to delete (unlink)
DROP POLICY IF EXISTS "Users delete own link" ON public.whatsapp_links;
CREATE POLICY "Users delete own link" ON public.whatsapp_links
    FOR DELETE USING (user_id = auth.uid());

-- Policies for LOGS
-- Users can view their own interaction logs (debug/transparency)
DROP POLICY IF EXISTS "Users view own logs" ON public.whatsapp_messages_log;
CREATE POLICY "Users view own logs" ON public.whatsapp_messages_log
    FOR SELECT USING (user_id = auth.uid());

-- Policies for STATE
-- Users not expected to query state directly from frontend, but allowed R if needed for debug
DROP POLICY IF EXISTS "Users view own state" ON public.whatsapp_conversation_state;
CREATE POLICY "Users view own state" ON public.whatsapp_conversation_state
    FOR SELECT USING (user_id = auth.uid());

-- 6. Indexes for Cleanup
-- Auto-expire old logs? Not implemented yet, but index ready.

-- 7. Add Feature Flag for WhatsApp
INSERT INTO public.feature_flags (key, description, is_enabled)
VALUES ('whatsapp_enabled', 'Enable WhatsApp Integration & Webhook Processing', false)
ON CONFLICT (key) DO NOTHING;
