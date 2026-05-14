import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'grocera.de' },
      { protocol: 'https', hostname: 'www.jamoona.com' },
      { protocol: 'https', hostname: 'jamoona.com' },
      { protocol: 'https', hostname: 'littleindia.de' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  // Playwright removed as scrapers now use fetch/cheerio
  experimental: {
    // Increase timeout for scraper routes
  },
};

export default nextConfig;
