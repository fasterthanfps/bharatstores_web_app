'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function GlobalLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reset loader when path or search params change (navigation complete)
  useEffect(() => {
    if (isLoading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 400); // Wait for the transition to finish and fade out
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isLoading) {
      setProgress(10);
      // Simulate progress bar moving up to 90%
      intervalId = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(intervalId);
            return 90;
          }
          // Incremental slowdown as it approaches 90%
          const increment = Math.max(1, (90 - prev) * 0.15);
          return Math.min(90, prev + increment);
        });
      }, 150);
    } else {
      setProgress(0);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoading]);

  useEffect(() => {
    // Intercept clicks on standard HTML anchors
    const handleAnchorClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const target = anchor.getAttribute('target');

      if (!href) return;

      // Ignore external links, mailto, tel, and new tab navigations
      if (
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        target === '_blank'
      ) {
        return;
      }

      // Check if it is the current page (to avoid false triggering)
      try {
        const targetUrl = new URL(href, window.location.href);
        if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search) {
          return;
        }
      } catch {
        if (href === window.location.pathname + window.location.search || href === window.location.pathname) {
          return;
        }
      }

      setIsLoading(true);
    };

    // Custom window events to trigger programmatic loaders
    const handleStartNav = () => setIsLoading(true);
    const handleStopNav = () => setIsLoading(false);

    document.addEventListener('click', handleAnchorClick);
    window.addEventListener('nav-start', handleStartNav);
    window.addEventListener('nav-stop', handleStopNav);

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      window.removeEventListener('nav-start', handleStartNav);
      window.removeEventListener('nav-stop', handleStopNav);
    };
  }, []);

  if (!isLoading && progress === 0) return null;

  return (
    <>
      {/* ── Top Progress Line ───────────────────────────── */}
      <div 
        className="fixed top-0 left-0 right-0 h-[3.5px] z-[9999] pointer-events-none transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: isLoading ? 1 : 0,
          background: 'linear-gradient(90deg, #C84B31 0%, #8B2020 100%)',
          boxShadow: '0 1px 8px rgba(200, 75, 49, 0.5), 0 0 4px rgba(139, 32, 32, 0.3)',
        }}
      />

      {/* ── Micro Spinner — top right ─────────────────────── */}
      <div 
        className="fixed top-3 right-3 z-[9999] pointer-events-none transition-opacity duration-300 flex items-center gap-2 bg-white/80 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-masala-border/60 shadow-sm"
        style={{ opacity: isLoading ? 1 : 0 }}
      >
        {/* Animated spinner rings */}
        <div className="relative w-4 h-4 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full border-2 border-masala-border/40 border-t-masala-primary animate-spin" />
          <div className="absolute w-2.5 h-2.5 rounded-full border-2 border-masala-border/30 border-b-masala-accent animate-spin [animation-duration:1.2s] [animation-direction:reverse]" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-masala-text-muted select-none">
          Loading
        </span>
      </div>
    </>
  );
}
