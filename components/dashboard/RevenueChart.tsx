'use client';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, ReferenceLine,
} from 'recharts';
import type { Transaction } from '@/types';
import { formatRupiah } from '@/lib/utils';

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function buildRevenueData(transactions: Transaction[] = []) {
  const today = startOfDay(new Date());
  const txns = transactions || [];

  return Array.from({ length: 14 }).map((_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (13 - i));
    const key = day.toDateString();
    const isToday = key === today.toDateString();

    const revenue = txns
      .filter(t => t?.created_at && startOfDay(new Date(t.created_at)).toDateString() === key)
      .reduce((sum, t) => sum + (t?.total || 0), 0);

    const count = txns.filter(
      t => t?.created_at && startOfDay(new Date(t.created_at)).toDateString() === key
    ).length;

    return {
      date: day.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      revenue,
      count,
      isToday,
    };
  });
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const { revenue, count } = payload[0].payload;
  return (
    <div className="rounded-xl border bg-card shadow-xl p-3 space-y-1 text-sm min-w-[160px]">
      <p className="font-bold text-foreground">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground text-xs">Omzet</span>
        <span className="font-bold text-primary">{formatRupiah(revenue)}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground text-xs">Transaksi</span>
        <span className="font-semibold">{count} order</span>
      </div>
    </div>
  );
}

// ─── Custom Dot ───────────────────────────────────────────────────────────────
function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  if (!payload.isToday) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="hsl(217 91% 60%)" stroke="white" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={10} fill="hsl(217 91% 60%)" opacity={0.2} />
    </g>
  );
}

export function RevenueChart({ transactions = [] }: { transactions?: Transaction[] }) {
  const data = buildRevenueData(transactions);
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const avgRevenue = data.reduce((s, d) => s + d.revenue, 0) / data.length;
  const todayData = data.find(d => d.isToday);

  return (
    <div className="space-y-3">
      {/* Mini stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span>Omzet harian</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span>Hari ini:</span>
          <span className="font-bold text-foreground">
            {todayData ? formatRupiah(todayData.revenue) : 'Rp 0'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Rata-rata:</span>
          <span className="font-bold text-foreground">{formatRupiah(Math.round(avgRevenue))}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="hsl(217 91% 60%)" stopOpacity={0.35} />
              <stop offset="60%"  stopColor="hsl(217 91% 60%)" stopOpacity={0.08} />
              <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="hsl(197 91% 60%)" />
              <stop offset="50%"  stopColor="hsl(217 91% 60%)" />
              <stop offset="100%" stopColor="hsl(237 91% 65%)" />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="currentColor"
            opacity={0.06}
          />

          <XAxis
            dataKey="date"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            interval={1}
          />

          <YAxis
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={v => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`}
            width={36}
          />

          {/* Average reference line */}
          {avgRevenue > 0 && (
            <ReferenceLine
              y={avgRevenue}
              stroke="hsl(217 91% 60%)"
              strokeDasharray="4 4"
              opacity={0.4}
              label={{
                value: 'Avg',
                position: 'insideTopRight',
                fontSize: 10,
                fill: 'hsl(217 91% 60%)',
              }}
            />
          )}

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(217 91% 60%)', strokeWidth: 1, strokeDasharray: '4 4' }} />

          <Area
            type="monotone"
            dataKey="revenue"
            stroke="url(#strokeGrad)"
            strokeWidth={2.5}
            fill="url(#revenueGrad)"
            dot={<CustomDot />}
            activeDot={{ r: 5, fill: 'hsl(217 91% 60%)', stroke: 'white', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}