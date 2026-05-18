'use client';

interface DataPoint {
  date: string;    // ISO string
  price: number;
  storeSlug: string;
}

interface PriceChartProps {
  history: DataPoint[];
  currentPrice: number;
  allTimeLow: number;
  allTimeHigh: number;
}

export default function PriceChart({ history, currentPrice, allTimeLow, allTimeHigh }: PriceChartProps) {
  const WIDTH  = 560;
  const HEIGHT = 160;
  const PAD    = { top: 16, right: 16, bottom: 32, left: 48 };

  const chartW = WIDTH  - PAD.left - PAD.right;
  const chartH = HEIGHT - PAD.top  - PAD.bottom;

  if (!history || history.length < 2) {
    return (
      <div className="flex items-center justify-center h-[160px] bg-masala-muted/30 rounded-2xl">
        <p className="text-sm text-masala-text-muted">Not enough price data yet</p>
      </div>
    );
  }

  const prices = history.map(h => h.price);
  const minP = Math.min(...prices) * 0.97;
  const maxP = Math.max(...prices) * 1.03;
  const range = maxP - minP || 1;

  const toX = (i: number) => PAD.left + (i / (history.length - 1)) * chartW;
  const toY = (p: number) => PAD.top + chartH - ((p - minP) / range) * chartH;

  // Build SVG path
  const points = history.map((h, i) => `${toX(i)},${toY(h.price)}`);
  const linePath  = `M ${points.join(' L ')}`;
  const areaPath  = `M ${toX(0)},${toY(minP)} L ${points.join(' L ')} L ${toX(history.length-1)},${toY(minP)} Z`;

  // Date labels (show ~5 evenly spaced)
  const labelStep = Math.max(1, Math.floor(history.length / 5));
  const dateLabels = history
    .map((h, i) => ({ i, label: new Date(h.date).toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' }) }))
    .filter((_, i) => i % labelStep === 0 || i === history.length - 1);

  // Price gridlines (3 lines)
  const gridPrices = [
    minP + range * 0.25,
    minP + range * 0.5,
    minP + range * 0.75,
  ];

  // Current price line position
  const currentY = toY(currentPrice);
  const isCurrentBelowAvg = currentPrice < (prices.reduce((a,b)=>a+b,0)/prices.length);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-white border border-masala-border">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        aria-label="Price history chart"
      >
        <defs>
          {/* Area gradient */}
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#8B2020" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#8B2020" stopOpacity="0.01" />
          </linearGradient>
          {/* Clip to chart area */}
          <clipPath id="chartClip">
            <rect x={PAD.left} y={PAD.top} width={chartW} height={chartH} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {gridPrices.map((p, i) => (
          <g key={i}>
            <line
              x1={PAD.left} y1={toY(p)}
              x2={PAD.left + chartW} y2={toY(p)}
              stroke="#E8E0D4" strokeWidth="1" strokeDasharray="4,4"
            />
            <text
              x={PAD.left - 6} y={toY(p) + 4}
              textAnchor="end" fontSize="10" fill="#9C8E84"
            >
              €{p.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGrad)" clipPath="url(#chartClip)" />

        {/* Price line */}
        <path
          d={linePath}
          fill="none"
          stroke="#8B2020"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath="url(#chartClip)"
        />

        {/* Current price horizontal dashed line */}
        <line
          x1={PAD.left} y1={currentY}
          x2={PAD.left + chartW} y2={currentY}
          stroke={isCurrentBelowAvg ? '#16a34a' : '#d97706'}
          strokeWidth="1.5"
          strokeDasharray="6,3"
        />
        <text
          x={PAD.left + chartW + 4} y={currentY + 4}
          fontSize="10" fill={isCurrentBelowAvg ? '#16a34a' : '#d97706'} fontWeight="700"
        >
          NOW
        </text>

        {/* Data point dots — only last point + highest + lowest */}
        {history.map((h, i) => {
          const isLast    = i === history.length - 1;
          const isLowest  = h.price === Math.min(...prices);
          const isHighest = h.price === Math.max(...prices);
          if (!isLast && !isLowest && !isHighest) return null;
          return (
            <circle
              key={i}
              cx={toX(i)} cy={toY(h.price)} r="4"
              fill={isLowest ? '#16a34a' : isHighest ? '#dc2626' : '#8B2020'}
              stroke="white" strokeWidth="2"
            />
          );
        })}

        {/* Date labels on X axis */}
        {dateLabels.map(({ i, label }) => (
          <text key={i} x={toX(i)} y={HEIGHT - 6}
            textAnchor="middle" fontSize="10" fill="#9C8E84">
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}
