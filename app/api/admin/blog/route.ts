import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = await req.json();

  const { data: post, error } = await supabase
    .from('blog_posts')
    .insert({
      slug:         body.slug,
      title:        body.title,
      excerpt:      body.excerpt,
      content:      body.content,
      author:       body.author,
      status:       body.status,
      lang:         body.lang,
      tags:         body.tags,
      seo_title:    body.seo_title,
      seo_desc:     body.seo_desc,
      cover_url:    body.cover_url,
      published_at: body.published_at,
    })
    .select('id, slug, title, excerpt, status, lang, tags, author, views, published_at, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ post });
}
