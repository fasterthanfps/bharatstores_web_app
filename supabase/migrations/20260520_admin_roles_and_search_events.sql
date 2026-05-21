-- Migration: add_admin_roles_search_events
-- Applied: 2026-05-20
-- Purpose: RBAC admin_users table, is_admin() helper, search_events indexes, scraper_runs store_name column

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_users_no_public_read" ON public.admin_users
  FOR SELECT USING (false);

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = uid
  );
$$;

CREATE INDEX IF NOT EXISTS search_events_zero_results_idx
  ON public.search_events (query, results_count, created_at DESC)
  WHERE results_count = 0;

CREATE INDEX IF NOT EXISTS search_events_created_at_idx
  ON public.search_events (created_at DESC);

ALTER TABLE public.scraper_runs
  ADD COLUMN IF NOT EXISTS store_name text;
