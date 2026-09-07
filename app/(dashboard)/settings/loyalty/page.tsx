'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { LoyaltySettings } from '@/components/loyalty/LoyaltySettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, ShieldCheck, Zap, Heart } from 'lucide-react';

export default function LoyaltySettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="⭐ Pengaturan Loyalty Poin" 
        description="Bangun loyalitas pelanggan dengan sistem poin otomatis."
      />

      <LoyaltySettings />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none bg-slate-50 dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-tight">
              <Zap className="h-4 w-4 text-primary" /> Cara Kerja
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500 leading-relaxed">
            Sistem akan secara otomatis menghitung poin setiap kali transaksi ditandai sebagai &quot;Selesai&quot;. Poin dihitung berdasarkan total nilai transaksi.
          </CardContent>
        </Card>

        <Card className="border-none bg-slate-50 dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-tight">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Otomatisasi
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500 leading-relaxed">
            Saat poin pelanggan mencapai ambang batas, sistem akan langsung menggenerate voucher unik dan (opsional) mengirimkannya via WhatsApp.
          </CardContent>
        </Card>

        <Card className="border-none bg-slate-50 dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-tight">
              <Heart className="h-4 w-4 text-rose-500" /> Retensi
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500 leading-relaxed">
            Program loyalty terbukti meningkatkan retensi pelanggan hingga 40%. Berikan apresiasi pada pelanggan setia Anda.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
