import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { marked } from 'marked';

async function incrementViews(id: string) {
  const supabase = await createClient();
  await supabase.rpc('increment_blog_views', { post_id: id });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, seo_title, seo_desc, excerpt, cover_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.seo_title ?? post.title + ' — BharatStores.eu',
    description: post.seo_desc ?? post.excerpt ?? undefined,
    openGraph: {
      title: post.seo_title ?? post.title,
      description: post.seo_desc ?? post.excerpt ?? undefined,
      images: post.cover_url ? [post.cover_url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!post) notFound();
  incrementViews(post.id).catch(() => {});

  const htmlContent = marked(post.content ?? '');

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <a href="/blog" className="text-sm text-masala-primary font-bold hover:underline mb-6 inline-block">
        ← Back to Blog
      </a>

      {post.cover_url && (
        <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-8 bg-masala-muted">
          <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      {post.tags && post.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {post.tags.map((tag: string) => (
            <span key={tag} className="px-3 py-1 rounded-full bg-masala-muted text-xs font-bold text-masala-text-muted border border-masala-border/60">
              {tag}
            </span>
          ))}
        </div>
      )}

      <h1 className="text-3xl sm:text-4xl font-black text-masala-text leading-tight mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
        {post.title}
      </h1>

      <div className="flex items-center gap-3 text-sm text-masala-text-muted mb-8 pb-6 border-b border-masala-border">
        <span className="font-semibold">{post.author}</span>
        <span>·</span>
        <span>
          {post.published_at
            ? new Date(post.published_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
            : ''}
        </span>
        <span>·</span>
        <span>{post.views ?? 0} views</span>
      </div>

      <div
        className="prose prose-stone max-w-none text-masala-text"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
