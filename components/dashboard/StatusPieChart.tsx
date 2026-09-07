'use client';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Transaction } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = [
  { key: 'diterima',  name: 'Diterima',  color: '#3b82f6', bg: 'bg-blue-500'   },
  { key: 'dicuci',    name: 'Dicuci',    color: '#06b6d4', bg: 'bg-cyan-500'   },
  { key: 'disetrika', name: 'Disetrika', color: '#f59e0b', bg: 'bg-amber-500'  },
  { key: 'selesai',   name: 'Selesai',   color: '#10b981', bg: 'bg-emerald-500'},
  { key: 'diambil',   name: 'Diambil',   color: '#64748b', bg: 'bg-slate-500'  },
] as const;

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0];
  const cfg = STATUS_CONFIG.find(s => s.name === name);
  return (
    <div className="rounded-xl border bg-card shadow-xl p-3 space-y-1 text-sm min-w-[140px]">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full" style={{ background: cfg?.color }} />
        <span className="font-bold">{name}</span>
      </div>
      <div className="flex justify-between gap-4 text-xs">
        <span className="text-muted-foreground">Jumlah</span>
        <span className="font-bold">{value} order</span>
      </div>
      <div className="flex justify-between gap-4 text-xs">
        <span className="text-muted-foreground">Persentase</span>
        <span className="font-bold">{(percent * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
}

// ─── Custom Label ─────────────────────────────────────────────────────────────
function CustomLabel({ cx, cy, total }: { cx: number; cy: number; total: number }) {
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground" fontSize={22} fontWeight={800}>
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="fill-muted-foreground" fontSize={11}>
        total order
      </text>
    </g>
  );
}

export function StatusPieChart({ transactions = [] }: { transactions?: Transaction[] }) {
  const data = STATUS_CONFIG.map(item => ({
    name:  item.name,
    value: transactions.filter(t => t.status === item.key).length,
    color: item.color,
    bg:    item.bg,
  })).filter(d => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[240px] gap-3 text-center">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-muted-foreground/20 border-t-muted-foreground/60 animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Belum ada data status</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pie */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.color}
                  stroke="transparent"
                  style={{ filter: `drop-shadow(0 2px 4px ${entry.color}40)` }}
                />
              ))}
              {/* Center label via foreignObject workaround using labelLine=false */}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center total — absolute overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black">{total}</span>
          <span className="text-xs text-muted-foreground">total order</span>
        </div>
      </div>

      {/* Legend dengan progress bar */}
      <div className="space-y-2">
        {data.map((item, i) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
                  <span className="font-medium text-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{item.value} order</span>
                  <span className="font-bold w-10 text-right" style={{ color: item.color }}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, background: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}