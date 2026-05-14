'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';

interface PricePoint {
    recorded_at: string;
    price: number;
    availability: string;
}

interface PriceHistoryChartProps {
    data: PricePoint[];
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-sm px-4 py-3 shadow-2xl text-sm">
            <p className="text-gray-400 mb-1">{label}</p>
            <p className="text-orange-400 font-bold text-base">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                    payload[0].value
                )}
            </p>
        </div>
    );
}

export default function PriceHistoryChart({ data }: PriceHistoryChartProps) {
    if (!data.length) return null;

    const chartData = data.map((d) => ({
        date: formatDate(d.recorded_at),
        price: d.price,
    }));

    const prices = data.map((d) => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return (
        <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) =>
                            new Intl.NumberFormat('de-DE', {
                                style: 'currency',
                                currency: 'EUR',
                                minimumFractionDigits: 0,
                            }).format(v)
                        }
                        width={55}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {minPrice !== maxPrice && (
                        <ReferenceLine
                            y={minPrice}
                            stroke="#10B981"
                            strokeDasharray="4 4"
                            strokeWidth={1}
                            label={{ value: 'Tiefstpreis', fill: '#10B981', fontSize: 10 }}
                        />
                    )}
                    <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#F97316"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#F97316', strokeWidth: 0 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
