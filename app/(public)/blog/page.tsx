import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ArrowRight, Clock, Tag } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Blog – BharatStores.eu | Tips for Indian Grocery Shopping in Europe',
    description:
        'Discover tips, guides, and insights for finding the best prices on Indian groceries in Germany and Europe. Shopping guides, store reviews, and money-saving tips.',
};

const BLOG_POSTS = [
    {
        slug: 'best-atta-brands-germany',
        title: 'Best Atta Brands Available in Germany',
        excerpt: 'We compare Aashirvaad, Pillsbury and Heera whole wheat flour – price per kg, quality, and availability across German Indian stores.',
        tag: 'Buying Guide',
        readTime: '5 min',
        emoji: '🌾',
        comingSoon: true,
    },
    {
        slug: 'amul-ghee-price-comparison',
        title: 'Where to Find Cheapest Amul Ghee in Europe',
        excerpt: 'Amul Ghee prices vary by up to 40% between stores. Here\'s a breakdown of the best deals and when to stock up.',
        tag: 'Price Guide',
        readTime: '4 min',
        emoji: '🧈',
        comingSoon: true,
    },
    {
        slug: 'indian-grocery-stores-germany-review',
        title: 'Top Indian Grocery Stores in Germany – Reviewed',
        excerpt: 'An honest review of Grocera, Jamoona, Little India and more – delivery times, selection, packaging quality, and prices.',
        tag: 'Store Review',
        readTime: '8 min',
        emoji: '🛒',
        comingSoon: true,
    },
    {
        slug: 'save-money-indian-groceries-europe',
        title: '10 Tips to Save Money on Indian Groceries in Europe',
        excerpt: 'From bulk buying to setting price alerts, here are the smartest ways to stretch your budget on your favourite Indian products.',
        tag: 'Tips & Tricks',
        readTime: '6 min',
        emoji: '💡',
        comingSoon: true,
    },
    {
        slug: 'basmati-rice-guide',
        title: 'Which Basmati Rice is Actually Worth It?',
        excerpt: 'Not all Basmati is created equal. We break down grain length, aroma, and price across TRS, Kohinoor, Heera and more.',
        tag: 'Product Guide',
        readTime: '7 min',
        emoji: '🍚',
        comingSoon: true,
    },
    {
        slug: 'paneer-in-europe',
        title: 'Finding Good Paneer in Europe – A Complete Guide',
        excerpt: 'Fresh paneer is hard to find outside India. We cover which brands ship to Germany, how to compare prices, and alternatives.',
        tag: 'Product Guide',
        readTime: '5 min',
        emoji: '🧀',
        comingSoon: true,
    },
];

const TAG_COLORS: Record<string, string> = {
    'Buying Guide': 'bg-blue-50 text-blue-700 border-blue-200',
    'Price Guide': 'bg-green-50 text-green-700 border-green-200',
    'Store Review': 'bg-purple-50 text-purple-700 border-purple-200',
    'Tips & Tricks': 'bg-amber-50 text-amber-700 border-amber-200',
    'Product Guide': 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function BlogPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-masala-bg to-[#f5dfc8]">
            {/* Hero */}
            <section className="px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-masala-primary/20 bg-white/80 px-4 py-1.5 text-sm text-masala-primary shadow-sm backdrop-blur-md">
                        <BookOpen className="h-4 w-4" />
                        BharatStores Blog
                    </div>
                    <h1 className="mb-4 text-4xl font-black font-serif text-masala-text sm:text-5xl">
                        Smart Shopping for <span className="gradient-text">Indians in Europe</span>
                    </h1>
                    <p className="text-masala-text/70 text-lg max-w-xl mx-auto leading-relaxed">
                        Guides, tips, and price insights for getting the most out of your Indian grocery budget across Germany and Europe.
                    </p>
                </div>
            </section>

            {/* Blog Grid */}
            <section className="px-4 sm:px-6 lg:px-8 pb-24">
                <div className="mx-auto max-w-6xl">
                    {/* Coming Soon Banner */}
                    <div className="mb-10 rounded-2xl border border-masala-primary/20 bg-white/70 backdrop-blur-sm p-6 text-center shadow-sm">
                        <p className="text-masala-text/80 font-medium">
                            🚀 <span className="font-bold text-masala-primary">Blog launching soon!</span> We&apos;re writing in-depth guides to help you save on Indian groceries in Europe.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {BLOG_POSTS.map((post, i) => (
                            <article
                                key={post.slug}
                                className="group bg-white border border-masala-border rounded-2xl overflow-hidden hover:border-masala-primary/30 hover:shadow-lg transition-all duration-300 animate-card"
                                style={{ animationDelay: `${i * 80}ms` }}
                            >
                                {/* Emoji header */}
                                <div className="h-32 bg-gradient-to-br from-masala-pill to-masala-border/50 flex items-center justify-center">
                                    <span className="text-6xl group-hover:scale-110 transition-transform duration-300">
                                        {post.emoji}
                                    </span>
                                </div>

                                <div className="p-6 space-y-3">
                                    {/* Tags row */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TAG_COLORS[post.tag] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                            <Tag className="h-2.5 w-2.5" />
                                            {post.tag}
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] text-masala-text/50">
                                            <Clock className="h-2.5 w-2.5" />
                                            {post.readTime} read
                                        </span>
                                        {post.comingSoon && (
                                            <span className="ml-auto text-[10px] font-bold text-masala-primary/60 uppercase tracking-wide">
                                                Coming Soon
                                            </span>
                                        )}
                                    </div>

                                    <h2 className="text-base font-bold font-serif text-masala-text leading-snug group-hover:text-masala-primary transition-colors">
                                        {post.title}
                                    </h2>

                                    <p className="text-sm text-masala-text/60 leading-relaxed line-clamp-3">
                                        {post.excerpt}
                                    </p>

                                    <div className="pt-2">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-masala-primary/60 cursor-default">
                                            Notify me when published
                                            <ArrowRight className="h-3 w-3" />
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Newsletter CTA */}
                    <div className="mt-16 rounded-3xl border border-masala-primary/20 bg-white p-10 text-center shadow-xl shadow-masala-primary/5">
                        <BookOpen className="h-12 w-12 text-masala-primary mx-auto mb-4" />
                        <h2 className="text-2xl font-bold font-serif text-masala-text mb-3">
                            Get notified when we publish
                        </h2>
                        <p className="text-masala-text/70 mb-6 text-sm max-w-md mx-auto">
                            We&apos;re working on comprehensive guides for Indians shopping in Europe. Be the first to know.
                        </p>
                        <Link
                            href="/account"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-header text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-masala-primary/25 active:scale-95"
                        >
                            Create Free Account
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
