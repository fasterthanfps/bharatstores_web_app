-- Migration: add_kanban_tables
-- Applied: 2026-05-23
-- Purpose: Add kanban_columns and kanban_cards tables with RLS and admin access control

CREATE TABLE IF NOT EXISTS public.kanban_columns (
  id          text PRIMARY KEY,
  title       text NOT NULL,
  color       text NOT NULL,
  wip_limit   integer NOT NULL DEFAULT 0,
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kanban_cards (
  id          text PRIMARY KEY,
  col_id      text NOT NULL REFERENCES public.kanban_columns(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('bug', 'feature', 'idea', 'update', 'task')),
  priority    text NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  title       text NOT NULL,
  description text,
  due_date    date,
  tags        text[] NOT NULL DEFAULT '{}',
  assignees   text[] NOT NULL DEFAULT '{}',
  comments    jsonb NOT NULL DEFAULT '[]'::jsonb,
  checklist   jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow all authenticated users (admins) to select, insert, update, delete
CREATE POLICY "kanban_columns_admin_all" ON public.kanban_columns
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "kanban_cards_admin_all" ON public.kanban_cards
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
