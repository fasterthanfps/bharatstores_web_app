import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — BharatStores.eu',
  description: 'Tips, deals, and guides for Indian grocery shopping in Germany.',
};

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_url, author, tags, lang, published_at, views')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-masala-text mb-2" style={{ fontFamily: 'Fraunces, serif' }}>
          Blog
        </h1>
        <p className="text-masala-text-muted text-lg">
          Tips, deals, and guides for Indian grocery shopping in Germany.
        </p>
      </div>

      {posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group">
              <article className="bg-white rounded-2xl border border-masala-border overflow-hidden
                hover:shadow-lg hover:border-masala-primary/20 transition-all duration-200">
                {post.cover_url ? (
                  <div className="aspect-[16/9] overflow-hidden bg-masala-muted">
                    <img src={post.cover_url} alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-gradient-to-br from-masala-primary/10 to-masala-primary/5 flex items-center justify-center">
                    <span className="text-4xl">📰</span>
                  </div>
                )}
                <div className="p-5">
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {post.tags.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="px-2.5 py-0.5 rounded-full bg-masala-muted text-[10px] font-bold text-masala-text-muted border border-masala-border/60">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2 className="text-base font-bold text-masala-text line-clamp-2 mb-2 group-hover:text-masala-primary transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-masala-text-muted line-clamp-2 leading-relaxed mb-3">{post.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-masala-text-muted">
                    <span>{post.author}</span>
                    <span>
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : ''}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-masala-text-muted">
          <span className="text-5xl">📝</span>
          <p className="mt-4 font-semibold">No posts yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
