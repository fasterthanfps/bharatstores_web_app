import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import BlogCMSClient from './BlogCMSClient';

export const metadata: Metadata = { title: 'Admin – Blog' };
export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, status, lang, tags, author, views, published_at, created_at, updated_at')
    .order('created_at', { ascending: false });

  const published = posts?.filter(p => p.status === 'published').length ?? 0;
  const drafts    = posts?.filter(p => p.status === 'draft').length ?? 0;
  const archived  = posts?.filter(p => p.status === 'archived').length ?? 0;

  return (
    <div className="space-y-6 text-masala-text">
      <BlogCMSClient
        initialPosts={posts ?? []}
        stats={{ published, drafts, archived }}
      />
    </div>
  );
}
