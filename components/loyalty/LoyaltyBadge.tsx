'use client';

import { useState } from 'react';
import { useCustomerLoyalty, useLoyaltySettings } from '@/hooks/useLoyalty';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRupiah, formatDate } from '@/lib/utils';
import { ChevronDown, ChevronUp, Star, History, TrendingUp, Crown, Award, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export function getTier(points: number) {
  if (points >= 500) return { label: 'Diamond', icon: Crown, color: 'text-cyan-500 bg-cyan-500/10' };
  if (points >= 250) return { label: 'Platinum', icon: Award, color: 'text-slate-400 bg-slate-400/10' };
  if (points >= 100) return { label: 'Gold', icon: Star, color: 'text-amber-500 bg-amber-500/10' };
  return { label: 'Silver', icon: Shield, color: 'text-slate-500 bg-slate-500/10' };
}

interface LoyaltyBadgeProps {
  customerId?: string | null;
  points?: number;
  showHistory?: boolean;
  className?: string;
}

export function LoyaltyBadge({ customerId, points: manualPoints, showHistory = false, className }: LoyaltyBadgeProps) {
  const { points: autoPoints, history, loading } = useCustomerLoyalty(customerId || null);
  const { settings, loading: settingsLoading } = useLoyaltySettings();
  const [expanded, setExpanded] = useState(false);

  const points = manualPoints !== undefined ? manualPoints : autoPoints;

  if (loading || settingsLoading) {
    return <Skeleton className={cn("h-10 w-32 rounded-full", className)} />;
  }

  const tier = getTier(points);
  const TierIcon = tier.icon;

  if (manualPoints !== undefined) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight", tier.color, className)}>
        <TierIcon className="h-3 w-3" />
        {tier.label}
      </div>
    );
  }

  const threshold = settings?.threshold_points || 100;
  const progress = Math.min(Math.round((points / threshold) * 100), 100);
  
  const rewardValue = settings?.reward_value ?? 10000;
  const rewardType = settings?.reward_type ?? 'fixed';

  const rewardText = rewardType === 'fixed' 
    ? formatRupiah(rewardValue)
    : `${rewardValue}%`;

  return (
    <div className={cn("space-y-3 w-full max-w-sm", className)}>
      <div 
        className={cn(
          "group relative overflow-hidden rounded-2xl border p-4 transition-all hover:shadow-md",
          "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Star className="h-4 w-4 fill-current" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Loyalty Poin</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{points} <span className="text-sm font-medium text-slate-400">Poin</span></p>
            </div>
          </div>
          <Badge variant="success" className="h-6">
            {progress}% Menuju Hadiah
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
            <span>Progress</span>
            <span>{points} / {threshold} Poin</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-center text-slate-500 italic">
            Dapatkan Voucher {rewardText} setiap {threshold} poin
          </p>
        </div>

        {showHistory && history.length > 0 && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="mt-4 flex w-full items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-tighter text-slate-400 hover:text-primary transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? 'Sembunyikan Riwayat' : 'Lihat Riwayat Poin'}
          </button>
        )}
      </div>

      {expanded && showHistory && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {history.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 p-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold",
                  h.type === 'earn' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-rose-100 dark:bg-rose-900/30 text-rose-600"
                )}>
                  {h.type === 'earn' ? '+' : '-'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{h.description || (h.type === 'earn' ? 'Poin Masuk' : 'Poin Digunakan')}</p>
                  <p className="text-[10px] text-slate-500">{formatDate(h.created_at)}</p>
                </div>
              </div>
              <span className={cn(
                "text-sm font-black",
                h.type === 'earn' ? "text-emerald-500" : "text-rose-500"
              )}>
                {h.type === 'earn' ? '+' : ''}{h.points}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
