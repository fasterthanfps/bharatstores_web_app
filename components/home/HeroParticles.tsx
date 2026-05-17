'use client';

import { useEffect, useRef } from 'react';

// Indian grocery-themed emojis / icons
const GROCERY_ITEMS = [
  { emoji: '🌶️', label: 'chilli' },
  { emoji: '🫙', label: 'jar' },
  { emoji: '🍚', label: 'rice' },
  { emoji: '🧅', label: 'onion' },
  { emoji: '🫚', label: 'oil' },
  { emoji: '🧄', label: 'garlic' },
  { emoji: '🫛', label: 'peas' },
  { emoji: '🥛', label: 'milk' },
  { emoji: '🌿', label: 'herb' },
  { emoji: '🫓', label: 'bread' },
  { emoji: '🫘', label: 'lentils' },
  { emoji: '🥥', label: 'coconut' },
  { emoji: '🍋', label: 'lemon' },
  { emoji: '🧈', label: 'butter' },
  { emoji: '☕', label: 'chai' },
  { emoji: '🌰', label: 'nut' },
];

interface Particle {
  id: number;
  emoji: string;
  x: number;        // vw %
  startY: number;   // start below screen (vh > 100)
  endY: number;     // end above screen (vh < -10)
  size: number;     // px
  duration: number; // ms
  delay: number;    // ms
  rotation: number; // deg
  rotationDelta: number;
  opacity: number;
  drift: number;    // horizontal sin drift px
}

function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function buildParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const r = (n: number) => seededRand(i * 17 + n);
    const item = GROCERY_ITEMS[i % GROCERY_ITEMS.length];
    return {
      id: i,
      emoji: item.emoji,
      x: 4 + r(1) * 92,        // 4% – 96% width
      startY: 105 + r(2) * 30, // 105–135 vh
      endY: -20 - r(3) * 20,   // -20 to -40 vh
      size: 20 + r(4) * 22,    // 20–42 px
      duration: 14000 + r(5) * 16000, // 14–30 s
      delay: r(6) * -28000,    // stagger across first 28 s
      rotation: r(7) * 360,
      rotationDelta: (r(8) - 0.5) * 180,
      opacity: 0.18 + r(9) * 0.28, // 0.18 – 0.46
      drift: (r(10) - 0.5) * 60,   // ±30 px horizontal drift
    };
  });
}

export default function HeroParticles({ count = 22 }: { count?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const particles = buildParticles(count);

    particles.forEach((p) => {
      const el = document.createElement('div');
      el.setAttribute('aria-hidden', 'true');
      el.textContent = p.emoji;
      el.style.cssText = `
        position: absolute;
        left: ${p.x}%;
        font-size: ${p.size}px;
        line-height: 1;
        pointer-events: none;
        user-select: none;
        will-change: transform, opacity;
        filter: saturate(0.7) brightness(0.9);
        animation: heroFloat_${p.id} ${p.duration}ms linear ${p.delay}ms infinite;
      `;

      // Inject per-particle keyframe
      const style = document.createElement('style');
      style.textContent = `
        @keyframes heroFloat_${p.id} {
          0% {
            transform: translateY(${p.startY}vh) translateX(0px) rotate(${p.rotation}deg);
            opacity: 0;
          }
          8% {
            opacity: ${p.opacity};
          }
          50% {
            transform: translateY(${(p.startY + p.endY) / 2}vh) translateX(${p.drift}px) rotate(${p.rotation + p.rotationDelta / 2}deg);
            opacity: ${p.opacity};
          }
          92% {
            opacity: ${p.opacity};
          }
          100% {
            transform: translateY(${p.endY}vh) translateX(${p.drift * 2}px) rotate(${p.rotation + p.rotationDelta}deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
      container.appendChild(el);
    });

    return () => {
      // cleanup on unmount
      container.innerHTML = '';
    };
  }, [count]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    />
  );
}
