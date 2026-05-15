-- Migration: add_click_events
-- Run this in your Supabase SQL Editor or via the Supabase CLI
-- Purpose: Track anonymous click events for UTM analytics (GDPR-compliant)

CREATE TABLE IF NOT EXISTS public.click_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       text NOT NULL,
  store_slug       text NOT NULL,
  search_query     text,
  result_position  integer NOT NULL DEFAULT 0,
  price            numeric(10,2) NOT NULL DEFAULT 0,
  destination_url  text NOT NULL,
  device_type      text NOT NULL DEFAULT 'desktop',
  ip_anonymized    text NOT NULL DEFAULT 'unknown',
  user_agent       text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS click_events_product_id_idx   ON public.click_events (product_id);
CREATE INDEX IF NOT EXISTS click_events_store_slug_idx   ON public.click_events (store_slug);
CREATE INDEX IF NOT EXISTS click_events_created_at_idx   ON public.click_events (created_at);
CREATE INDEX IF NOT EXISTS click_events_search_query_idx ON public.click_events (search_query)
  WHERE search_query IS NOT NULL;

-- Row Level Security — only service role can insert/read
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;

-- Service role policy (server-side only)
CREATE POLICY "service_role_full_access" ON public.click_events
  USING (true)
  WITH CHECK (true);

-- Allow anon to INSERT (for the redirect API which uses service client anyway)
-- Revoke public access
REVOKE ALL ON public.click_events FROM anon, authenticated;

-- Comment for documentation
COMMENT ON TABLE public.click_events IS
  'Anonymous click events for UTM analytics. IP last octet zeroed for GDPR. Auto-deleted after 90 days via /api/cron/cleanup.';
