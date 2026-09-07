'use client';

import { useState, useEffect } from 'react';
import { Shirt, Send, X, CheckCircle2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoucherGeneratedToastProps {
  voucherCode: string;
  whatsappUrl?: string | null;
  onClose: () => void;
}

export function VoucherGeneratedToast({ 
  voucherCode, 
  whatsappUrl, 
  onClose 
}: VoucherGeneratedToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 8000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className={cn(
        "fixed bottom-6 left-6 right-6 z-[100] sm:left-auto sm:w-[400px] transition-all duration-300 transform",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
      )}
    >
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-white dark:bg-slate-900 p-6 shadow-2xl shadow-primary/10">
        {/* Confetti-like background ornament */}
        <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
        
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Loyalty Voucher!</h3>
            <p className="text-sm text-slate-500 font-medium">Pelanggan baru saja mendapatkan voucher spesial.</p>
          </div>

          <div className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800 p-4 border-2 border-dashed border-primary/30 flex flex-col items-center space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Kode Voucher</span>
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-slate-400" />
              <span className="text-2xl font-black font-mono tracking-tighter text-slate-900 dark:text-white">{voucherCode}</span>
            </div>
          </div>

          <div className="flex w-full gap-2">
            {whatsappUrl && (
              <Button 
                onClick={() => window.open(whatsappUrl, '_blank')}
                className="flex-1 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20"
              >
                <Send className="mr-2 h-4 w-4" /> Kirim WA
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="flex-1 h-12 rounded-2xl border-slate-200 font-bold uppercase tracking-widest"
            >
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
