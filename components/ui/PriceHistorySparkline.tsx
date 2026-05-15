'use client';

interface PricePoint {
  date: string;
  price: number;
}

interface PriceHistorySparklineProps {
  data: PricePoint[];
  color?: string;
  width?: number;
  height?: number;
}

export default function PriceHistorySparkline({
  data,
  color = '#8B2020',
  width = 160,
  height = 48,
}: PriceHistorySparklineProps) {
  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-12 text-xs text-masala-text-light">
        No history data
      </div>
    );
  }

  const prices = data.map(d => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const padX = 4;
  const padY = 4;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * innerW;
    const y = padY + (1 - (d.price - min) / range) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polylinePoints = points.join(' ');
  const lastPoint = points[points.length - 1].split(',');
  const firstPoint = points[0].split(',');

  // Area fill path
  const areaPath = `M ${firstPoint[0]},${padY + innerH} L ${polylinePoints.split(' ').map(p => p).join(' L ')} L ${lastPoint[0]},${padY + innerH} Z`;

  const lowestPrice = min;
  const highestPrice = max;
  const currentPrice = prices[prices.length - 1];

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={`sparkGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path
          d={areaPath}
          fill={`url(#sparkGrad-${color.replace('#', '')})`}
        />
        {/* Line */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Last point dot */}
        <circle
          cx={lastPoint[0]}
          cy={lastPoint[1]}
          r="3"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-[11px]">
        <span className="text-masala-text-muted">
          Low: <strong className="text-masala-success">€{lowestPrice.toFixed(2)}</strong>
        </span>
        <span className="text-masala-text-muted">
          High: <strong className="text-red-500">€{highestPrice.toFixed(2)}</strong>
        </span>
        <span className="text-masala-text-muted">
          Now: <strong className="text-masala-primary">€{currentPrice.toFixed(2)}</strong>
        </span>
      </div>
    </div>
  );
}
