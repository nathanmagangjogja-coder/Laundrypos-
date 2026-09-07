'use client';
/**
 * components/loyalty/VoucherSuccessPopup.tsx
 * Animated popup with confetti when a voucher is generated after transaction.
 */
import { useEffect, useRef } from 'react';
import { X, Gift, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Voucher } from '@/types';

interface VoucherSuccessPopupProps {
  voucher: Voucher | null;
  points?: number;
  onClose: () => void;
}

// Lightweight CSS confetti (no external dep)
function Confetti() {
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.8}s`,
    duration: `${0.8 + Math.random() * 0.6}s`,
    size: `${6 + Math.random() * 8}px`,
    rotate: `${Math.random() * 360}deg`,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: 0,
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${p.rotate})`,
            animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

export function VoucherSuccessPopup({ voucher, points = 0, onClose }: VoucherSuccessPopupProps) {
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!voucher) return null;

  const expDate = new Date(voucher.expired_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  async function copyCode() {
    await navigator.clipboard.writeText(voucher!.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Popup */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-400 shadow-2xl overflow-hidden">
        {showConfetti && <Confetti />}

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-6 text-center text-white">
          <div className="flex justify-center mb-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-4xl shadow-lg">
              🎉
            </div>
          </div>
          <h2 className="text-xl font-black">Selamat!</h2>
          <p className="text-emerald-50 text-sm mt-1">
            Anda mendapat voucher loyalitas
          </p>
        </div>

        {/* Voucher details */}
        <div className="p-5 space-y-4">
          {/* Points earned */}
          {points > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <div>
                  <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">Poin Earned</div>
                  <div className="font-bold text-amber-800 dark:text-amber-300">+{points} poin</div>
                </div>
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-500 text-right">
                1 poin per<br />Rp 10.000
              </div>
            </div>
          )}

          {/* Voucher box */}
          <div className="rounded-xl border-2 border-dashed border-emerald-400 overflow-hidden">
            <div className="bg-emerald-50 dark:bg-emerald-950 px-4 py-2">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {voucher.title}
                </span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <code className="font-mono font-black text-xl tracking-widest text-slate-800 dark:text-slate-100">
                  {voucher.code}
                </code>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Disalin!' : 'Salin'}
                </button>
              </div>
              <div className="text-xs text-muted-foreground">
                Diskon Rp {voucher.discount_amount.toLocaleString('id-ID')} •
                Min. Rp {voucher.minimum_order.toLocaleString('id-ID')}
              </div>
              <div className="text-xs text-muted-foreground">
                📅 Berlaku hingga: <span className="font-medium">{expDate}</span>
              </div>
            </div>
          </div>

          <Button onClick={onClose} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            Oke, Mengerti 🎊
          </Button>
        </div>
      </div>
    </div>
  );
}
