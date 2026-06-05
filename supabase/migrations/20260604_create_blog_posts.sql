-- Migration: create_blog_posts
-- Applied: 2026-06-04
-- Purpose: Add blog_posts table, public read access RLS policies, and view increment RPC function

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id           uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  slug         text NOT NULL UNIQUE,
  title        text NOT NULL,
  excerpt      text,
  content      text NOT NULL,
  author       text NOT NULL DEFAULT 'BharatStores Team',
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  lang         text NOT NULL DEFAULT 'en' CHECK (lang IN ('en', 'de', 'both')),
  tags         text[] DEFAULT '{}',
  seo_title    text,
  seo_desc     text,
  cover_url    text,
  views        integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Select policies: public can read published posts
CREATE POLICY "blog_posts_public_select" ON public.blog_posts
  FOR SELECT
  USING (status = 'published');

-- Admin policies: admin can do everything
CREATE POLICY "blog_posts_admin_all" ON public.blog_posts
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- RPC function to increment views
CREATE OR REPLACE FUNCTION public.increment_blog_views(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.blog_posts
  SET views = COALESCE(views, 0) + 1
  WHERE id = post_id;
END;
$$;
