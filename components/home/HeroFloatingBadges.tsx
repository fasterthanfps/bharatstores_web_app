'use client';

import { useEffect, useState } from 'react';

const DEALS = [
  { store: 'Dookan', product: 'MDH Masala', old: '€3.49', now: '€2.19', save: '37%' },
  { store: 'Jamoona', product: 'Basmati 5kg', old: '€12.99', now: '€8.49', save: '35%' },
  { store: 'Swadesh', product: 'Toor Dal 1kg', old: '€4.29', now: '€2.79', save: '35%' },
  { store: 'Dookan', product: 'Ghee 500ml', old: '€7.99', now: '€5.49', save: '31%' },
  { store: 'Jamoona', product: 'Atta 5kg', old: '€9.49', now: '€6.29', save: '34%' },
];

interface Badge {
  id: number;
  deal: typeof DEALS[0];
  x: string;
  y: string;
  delay: number;
}

const POSITIONS: { x: string; y: string }[] = [
  { x: '4%', y: '18%' },
  { x: '82%', y: '12%' },
  { x: '88%', y: '62%' },
  { x: '2%', y: '68%' },
  { x: '76%', y: '36%' },
];

export default function HeroFloatingBadges() {
  const [visible, setVisible] = useState(false);

  // Delay mount so the page content loads first
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const badges: Badge[] = DEALS.slice(0, 4).map((deal, i) => ({
    id: i,
    deal,
    x: POSITIONS[i].x,
    y: POSITIONS[i].y,
    delay: i * 180,
  }));

  return (
    <>
      {badges.map((b) => (
        <div
          key={b.id}
          aria-hidden="true"
          className="hero-deal-badge"
          style={{
            left: b.x,
            top: b.y,
            animationDelay: `${b.delay}ms`,
          }}
        >
          <div className="hero-deal-badge__store">{b.deal.store}</div>
          <div className="hero-deal-badge__product">{b.deal.product}</div>
          <div className="hero-deal-badge__prices">
            <span className="hero-deal-badge__old">{b.deal.old}</span>
            <span className="hero-deal-badge__now">{b.deal.now}</span>
          </div>
          <div className="hero-deal-badge__save">Save {b.deal.save}</div>
        </div>
      ))}
    </>
  );
}
