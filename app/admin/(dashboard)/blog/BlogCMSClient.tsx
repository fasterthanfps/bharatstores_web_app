'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  Plus, Search, Edit2, Trash2, Eye,
  FileText, CheckCircle, Archive, Clock,
  TrendingUp, X
} from 'lucide-react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  status: 'draft' | 'published' | 'archived';
  lang: 'en' | 'de' | 'both';
  tags: string[];
  author: string;
  views: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  initialPosts: BlogPost[];
  stats: { published: number; drafts: number; archived: number };
}

export default function BlogCMSClient({ initialPosts, stats }: Props) {
  const [posts, setPosts]               = useState<BlogPost[]>(initialPosts);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [langFilter, setLangFilter]     = useState<string>('all');
  const [searchQ, setSearchQ]           = useState('');
  const [editorOpen, setEditorOpen]     = useState(false);
  const [editingPost, setEditingPost]   = useState<BlogPost | null>(null);
  const [, startTransition]             = useTransition();

  // Form state
  const [fTitle,    setFTitle]    = useState('');
  const [fSlug,     setFSlug]     = useState('');
  const [fExcerpt,  setFExcerpt]  = useState('');
  const [fContent,  setFContent]  = useState('');
  const [fAuthor,   setFAuthor]   = useState('BharatStores Team');
  const [fStatus,   setFStatus]   = useState<'draft' | 'published' | 'archived'>('draft');
  const [fLang,     setFLang]     = useState<'en' | 'de' | 'both'>('en');
  const [fTags,     setFTags]     = useState('');
  const [fSeoTitle, setFSeoTitle] = useState('');
  const [fSeoDesc,  setFSeoDesc]  = useState('');
  const [fCoverUrl, setFCoverUrl] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 80);

  const openNew = () => {
    setEditingPost(null);
    setFTitle(''); setFSlug(''); setFExcerpt(''); setFContent('');
    setFAuthor('BharatStores Team'); setFStatus('draft'); setFLang('en');
    setFTags(''); setFSeoTitle(''); setFSeoDesc(''); setFCoverUrl('');
    setEditorOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFTitle(post.title); setFSlug(post.slug);
    setFExcerpt(post.excerpt ?? ''); setFContent('');
    setFAuthor(post.author); setFStatus(post.status);
    setFLang(post.lang); setFTags((post.tags ?? []).join(', '));
    setFSeoTitle(''); setFSeoDesc(''); setFCoverUrl('');
    setEditorOpen(true);
  };

  const visible = useMemo(() => posts.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (langFilter   !== 'all' && p.lang   !== langFilter)   return false;
    if (searchQ && !p.title.toLowerCase().includes(searchQ.toLowerCase()) &&
        !(p.excerpt ?? '').toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  }), [posts, statusFilter, langFilter, searchQ]);

  const handleSave = async () => {
    if (!fTitle.trim()) { alert('Title is required'); return; }
    setSaving(true);
    const slug = fSlug.trim() || autoSlug(fTitle);
    const payload = {
      slug, title: fTitle.trim(), excerpt: fExcerpt.trim() || null,
      content: fContent.trim(), author: fAuthor.trim(), status: fStatus,
      lang: fLang, tags: fTags.split(',').map(t => t.trim()).filter(Boolean),
      seo_title: fSeoTitle.trim() || null, seo_desc: fSeoDesc.trim() || null,
      cover_url: fCoverUrl.trim() || null,
      published_at: fStatus === 'published' ? new Date().toISOString() : null,
    };
    const res = await fetch(
      editingPost ? `/api/admin/blog/${editingPost.id}` : '/api/admin/blog',
      { method: editingPost ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { alert(json.error ?? 'Save failed'); return; }
    if (editingPost) {
      setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...json.post } : p));
    } else {
      setPosts(prev => [json.post, ...prev]);
    }
    setEditorOpen(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
    if (res.ok) { setPosts(prev => prev.filter(p => p.id !== id)); setDeleteConfirm(null); }
    else alert('Delete failed');
  };

  const handleStatusChange = async (id: string, newStatus: BlogPost['status']) => {
    const res = await fetch(`/api/admin/blog/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, published_at: newStatus === 'published' ? new Date().toISOString() : undefined }),
    });
    if (res.ok) {
      const { post } = await res.json();
      setPosts(prev => prev.map(p => p.id === id ? { ...p, ...post } : p));
    }
  };

  const statusColor: Record<string, string> = {
    published: 'bg-emerald-100 border-emerald-200 text-emerald-800',
    draft:     'bg-amber-100 border-amber-200 text-amber-800',
    archived:  'bg-gray-100 border-gray-200 text-gray-600',
  };

  const inputCls = 'w-full rounded-xl border border-masala-border bg-masala-muted/20 px-4 py-2.5 text-sm text-masala-text outline-none focus:border-masala-primary transition-all';

  return (
    <>
      {/* PAGE HEADER */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>Blog CMS</h1>
          <p className="text-sm text-masala-text-muted mt-1">
            <span className="font-bold text-emerald-700">{stats.published} published</span>
            {' · '}
            <span className="font-bold text-amber-700">{stats.drafts} draft{stats.drafts !== 1 ? 's' : ''}</span>
            {' · '}
            <span className="text-masala-text-muted">{stats.archived} archived</span>
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-masala-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-masala-secondary shadow-sm active:scale-[0.98] transition-all">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-masala-muted/40 rounded-xl p-1 border border-masala-border/50">
          {[{id:'all',label:'All'},{id:'published',label:'Published'},{id:'draft',label:'Drafts'},{id:'archived',label:'Archived'}].map(tab => (
            <button key={tab.id} onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === tab.id ? 'bg-white text-masala-text shadow-sm border border-masala-border/60' : 'text-masala-text-muted hover:text-masala-text'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-masala-muted/40 rounded-xl p-1 border border-masala-border/50">
          {[{id:'all',label:'All Langs'},{id:'en',label:'🇬🇧 EN'},{id:'de',label:'🇩🇪 DE'},{id:'both',label:'🌍 Both'}].map(tab => (
            <button key={tab.id} onClick={() => setLangFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${langFilter === tab.id ? 'bg-white text-masala-text shadow-sm border border-masala-border/60' : 'text-masala-text-muted hover:text-masala-text'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-masala-text-muted" />
          <input type="text" placeholder="Search posts..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl bg-white border border-masala-border text-sm outline-none focus:border-masala-primary transition-all w-52" />
        </div>
      </div>

      {/* POSTS TABLE */}
      <div className="rounded-xl bg-white border border-masala-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-masala-border bg-masala-muted/30 text-left text-xs uppercase tracking-wider text-masala-text-muted">
                <th className="px-5 py-3.5 font-bold">Title</th>
                <th className="px-4 py-3.5 font-bold">Status</th>
                <th className="px-4 py-3.5 font-bold">Lang</th>
                <th className="px-4 py-3.5 font-bold">Tags</th>
                <th className="px-4 py-3.5 font-bold">Date</th>
                <th className="px-4 py-3.5 font-bold text-right">Views</th>
                <th className="px-4 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-masala-border">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-masala-text-muted text-sm">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No posts found.{' '}
                    <button onClick={openNew} className="text-masala-primary font-bold hover:underline">
                      Create your first post →
                    </button>
                  </td>
                </tr>
              ) : visible.map(post => (
                <tr key={post.id} className="hover:bg-masala-muted/20 transition-colors">
                  <td className="px-5 py-4 max-w-xs">
                    <p className="font-semibold text-masala-text line-clamp-1">{post.title}</p>
                    <p className="text-[11px] text-masala-text-muted mt-0.5 font-mono">/{post.slug}</p>
                  </td>
                  <td className="px-4 py-4">
                    <select value={post.status} onChange={e => handleStatusChange(post.id, e.target.value as BlogPost['status'])}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border outline-none cursor-pointer ${statusColor[post.status]}`}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm">{post.lang === 'en' ? '🇬🇧' : post.lang === 'de' ? '🇩🇪' : '🌍'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1 flex-wrap max-w-[140px]">
                      {(post.tags ?? []).slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-masala-muted text-[10px] font-bold text-masala-text-muted border border-masala-border/60">{tag}</span>
                      ))}
                      {(post.tags ?? []).length > 3 && <span className="text-[10px] text-masala-text-muted">+{post.tags.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-masala-text-muted whitespace-nowrap">
                    {post.status === 'published' && post.published_at
                      ? new Date(post.published_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : new Date(post.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-semibold text-masala-text-muted">{post.views?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {post.status === 'published' && (
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-masala-muted text-masala-text-muted hover:text-masala-text transition-colors" title="View live">
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                      <button onClick={() => openEdit(post)}
                        className="p-1.5 rounded-lg hover:bg-masala-muted text-masala-text-muted hover:text-masala-primary transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(post.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-masala-text-muted hover:text-red-600 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELETE CONFIRM */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-masala-border p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-black text-masala-text mb-2">Delete post?</h3>
            <p className="text-sm text-masala-text-muted mb-5">This cannot be undone. The post will be permanently deleted.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-masala-border text-sm font-bold text-masala-text hover:bg-masala-muted transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* POST EDITOR MODAL */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-masala-border shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-masala-border flex-shrink-0">
              <h2 className="text-base font-black text-masala-text">{editingPost ? 'Edit Post' : 'New Blog Post'}</h2>
              <button onClick={() => setEditorOpen(false)} className="p-1.5 rounded-lg hover:bg-masala-muted transition-colors text-masala-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-masala-text-muted mb-1.5">Title *</label>
                  <input type="text" value={fTitle}
                    onChange={e => { setFTitle(e.target.value); if (!editingPost) setFSlug(autoSlug(e.target.value)); }}
                    placeholder="How to save money on Indian groceries in Germany" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-masala-text-muted mb-1.5">Slug</label>
                  <input type="text" value={fSlug} onChange={e => setFSlug(e.target.value)}
                    placeholder="auto-generated-from-title"
                    className="w-full rounded-xl border border-masala-border bg-masala-muted/20 px-4 py-2.5 text-sm font-mono text-masala-text-muted outline-none focus:border-masala-primary transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-masala-text-muted mb-1.5">Author</label>
                  <input type="text" value={fAuthor} onChange={e => setFAuthor(e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-masala-text-muted mb-1.5">Excerpt</label>
                <textarea value={fExcerpt} onChange={e => setFExcerpt(e.target.value)} rows={2}
                  placeholder="A short summary..." className={`${inputCls} resize-none`} />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-masala-text-muted mb-1.5">Content (Markdown supported)</label>
                <textarea value={fContent} onChange={e => setFContent(e.target.value)} rows={10}
                  placeholder={`# Heading\n\nWrite your post content here.\n\n**Bold**, *italic*, [links](https://...)`}
                  className={`${inputCls} font-mono resize-y min-h-[200px]`} />
                <p className="text-[10px] text-masala-text-muted mt-1">Use ## for headings, **bold**, *italic*, - for lists.</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-masala-text-muted mb-1.5">Cover Image URL</label>
                <input type="url" value={fCoverUrl} onChange={e => setFCoverUrl(e.target.value)} placeholder="https://..." className={inputCls} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-masala-text-muted mb-1.5">Status</label>
                  <select value={fStatus} onChange={e => setFStatus(e.target.value as 'draft' | 'published' | 'archived')} className={inputCls}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-masala-text-muted mb-1.5">Language</label>
                  <select value={fLang} onChange={e => setFLang(e.target.value as 'en' | 'de' | 'both')} className={inputCls}>
                    <option value="en">🇬🇧 English</option>
                    <option value="de">🇩🇪 German</option>
                    <option value="both">🌍 Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-masala-text-muted mb-1.5">Tags (comma separated)</label>
                  <input type="text" value={fTags} onChange={e => setFTags(e.target.value)} placeholder="recipes, deals, tips" className={inputCls} />
                </div>
              </div>

              <div className="rounded-xl bg-masala-muted/30 border border-masala-border/60 p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-masala-text-muted">SEO (optional)</p>
                <input type="text" value={fSeoTitle} onChange={e => setFSeoTitle(e.target.value)}
                  placeholder="SEO title (defaults to post title)"
                  className="w-full rounded-xl border border-masala-border bg-white px-4 py-2 text-sm text-masala-text outline-none focus:border-masala-primary transition-all" />
                <textarea value={fSeoDesc} onChange={e => setFSeoDesc(e.target.value)} rows={2}
                  placeholder="SEO meta description (150-160 chars)"
                  className="w-full rounded-xl border border-masala-border bg-white px-4 py-2 text-sm text-masala-text outline-none focus:border-masala-primary transition-all resize-none" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-masala-border bg-masala-muted/20 flex-shrink-0">
              <p className="text-xs text-masala-text-muted">
                {fStatus === 'published' ? '🟢 Will be visible on /blog immediately' : '🟡 Saved as draft'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setEditorOpen(false)}
                  className="px-4 py-2 rounded-xl border border-masala-border text-sm font-bold text-masala-text hover:bg-masala-muted transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="px-5 py-2 rounded-xl bg-masala-primary text-white text-sm font-bold hover:bg-masala-secondary disabled:opacity-50 transition-colors shadow-sm">
                  {saving ? 'Saving...' : editingPost ? 'Save Changes' : 'Publish Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
