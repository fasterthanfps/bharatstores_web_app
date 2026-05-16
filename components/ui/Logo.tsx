import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-1.5 group">
      <span className="text-xl sm:text-2xl font-black font-serif tracking-tight text-masala-primary group-hover:scale-105 transition-transform">
        Bharat<span className="text-masala-secondary">Stores</span>
        <span className="text-[10px] sm:text-xs text-masala-text/40 font-sans font-semibold tracking-normal ml-0.5">.eu</span>
      </span>
    </Link>
  );
}
