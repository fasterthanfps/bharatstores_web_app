import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await req.json();

  const updatePayload: Record<string, unknown> = {};
  const allowed = [
    'slug', 'title', 'excerpt', 'content', 'author', 'status', 'lang',
    'tags', 'seo_title', 'seo_desc', 'cover_url', 'published_at',
  ];
  for (const key of allowed) {
    if (key in body) updatePayload[key] = body[key];
  }

  const { data: post, error } = await supabase
    .from('blog_posts')
    .update(updatePayload)
    .eq('id', id)
    .select('id, slug, title, excerpt, status, lang, tags, author, views, published_at, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ post });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
