-- Migration: Push Rate Limiting
-- Description: Adds push_rate_limits table and check function

CREATE TABLE IF NOT EXISTS public.push_rate_limits (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, window_start)
);

-- Enable RLS (Service role will bypass)
ALTER TABLE public.push_rate_limits ENABLE ROW LEVEL SECURITY;

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION public.check_push_rate_limit(p_user_id UUID, p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_requests CONSTANT INTEGER := 30;
  v_window_minutes CONSTANT INTEGER := 10;
  v_current_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Cleanup old records
  DELETE FROM public.push_rate_limits 
  WHERE window_start < NOW() - (v_window_minutes * INTERVAL '1 minute');

  -- Get current window record
  SELECT count, window_start INTO v_current_count, v_window_start
  FROM public.push_rate_limits
  WHERE user_id = p_user_id
  ORDER BY window_start DESC
  LIMIT 1;

  IF v_window_start IS NULL OR v_window_start < NOW() - (v_window_minutes * INTERVAL '1 minute') THEN
    -- Start new window
    INSERT INTO public.push_rate_limits (user_id, org_id, window_start, count)
    VALUES (p_user_id, p_org_id, NOW(), 1);
    RETURN TRUE;
  ELSIF v_current_count < v_max_requests THEN
    -- Increment current window
    UPDATE public.push_rate_limits
    SET count = count + 1
    WHERE user_id = p_user_id AND window_start = v_window_start;
    RETURN TRUE;
  ELSE
    -- Rate limit exceeded
    RETURN FALSE;
  END IF;
END;
$$;
