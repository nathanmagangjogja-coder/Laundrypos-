'use client';

import { useState, useEffect } from 'react';
import { useLoyaltySettings } from '@/hooks/useLoyalty';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRupiah, cn } from '@/lib/utils';
import { Loader2, Save, Gift, Target, Coins, Zap } from 'lucide-react';

export function LoyaltySettings() {
  const { settings, loading, updateSettings, saving } = useLoyaltySettings();
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (settings) {
      setForm(settings);
    } else if (!loading) {
      // Default initial state
      setForm({
        points_per_transaction: true,
        points_formula: 10000,
        threshold_points: 100,
        reward_type: 'fixed',
        reward_value: 10000,
        reward_min_purchase: 0,
        voucher_expiry_days: 30,
        auto_send_whatsapp: true,
        active: true
      });
    }
  }, [settings, loading]);

  if (loading || !form) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  const handleSave = () => {
    updateSettings(form);
  };

  const rewardPreview = form.reward_type === 'fixed' 
    ? formatRupiah(form.reward_value)
    : `${form.reward_value}%`;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8 space-y-6">
        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Konfigurasi Poin</CardTitle>
                <CardDescription>Atur bagaimana pelanggan mendapatkan poin loyalitas.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nilai Transaksi per 1 Poin (Rp)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">Rp</span>
                  <Input 
                    type="number" 
                    value={form.points_formula}
                    onChange={e => setForm({ ...form, points_formula: Number(e.target.value) })}
                    className="pl-10 h-11"
                  />
                </div>
                <p className="text-[10px] text-slate-400 italic">Contoh: Rp 10.000 = 1 Poin</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Ambang Batas Penukaran (Poin)</Label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="number" 
                    value={form.threshold_points}
                    onChange={e => setForm({ ...form, threshold_points: Number(e.target.value) })}
                    className="pl-10 h-11"
                  />
                </div>
                <p className="text-[10px] text-slate-400 italic">Jumlah poin untuk mendapatkan voucher</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">Hadiah & Voucher</CardTitle>
                <CardDescription>Tentukan nilai voucher yang didapatkan pelanggan.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Tipe Hadiah</Label>
                <Select value={form.reward_type} onValueChange={v => setForm({ ...form, reward_type: v })}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Nominal Tetap (Rp)</SelectItem>
                    <SelectItem value="percentage">Persentase (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nilai Hadiah</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">
                    {form.reward_type === 'fixed' ? 'Rp' : '%'}
                  </span>
                  <Input 
                    type="number" 
                    value={form.reward_value}
                    onChange={e => setForm({ ...form, reward_value: Number(e.target.value) })}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Min. Pembelian (Rp)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">Rp</span>
                  <Input 
                    type="number" 
                    value={form.reward_min_purchase}
                    onChange={e => setForm({ ...form, reward_min_purchase: Number(e.target.value) })}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Masa Berlaku Voucher (Hari)</Label>
                <Input 
                  type="number" 
                  value={form.voucher_expiry_days}
                  onChange={e => setForm({ ...form, voucher_expiry_days: Number(e.target.value) })}
                  className="h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <Card className="bg-primary text-white border-none shadow-2xl shadow-primary/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 fill-white" /> Ringkasan Sistem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-white/10 p-4 space-y-3">
              <p className="text-sm font-medium leading-relaxed">
                Setiap transaksi <span className="font-black underline">Rp {form.points_formula.toLocaleString()}</span> akan mendapatkan <span className="font-black underline">1 poin</span>.
              </p>
              <div className="h-px bg-white/20" />
              <p className="text-sm font-medium leading-relaxed">
                Kumpulkan <span className="font-black underline">{form.threshold_points} poin</span> untuk mendapatkan Voucher <span className="font-black underline">{rewardPreview}</span>.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest opacity-70">Auto-WA</span>
                <button 
                  onClick={() => setForm({ ...form, auto_send_whatsapp: !form.auto_send_whatsapp })}
                  className={cn(
                    "relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    form.auto_send_whatsapp ? "bg-white" : "bg-white/20"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none block h-4 w-4 rounded-full bg-primary shadow-lg ring-0 transition-transform",
                    form.auto_send_whatsapp ? "translate-x-5" : "translate-x-1"
                  )} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest opacity-70">Status Aktif</span>
                <button 
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={cn(
                    "relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    form.active ? "bg-white" : "bg-white/20"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none block h-4 w-4 rounded-full bg-primary shadow-lg ring-0 transition-transform",
                    form.active ? "translate-x-5" : "translate-x-1"
                  )} />
                </button>
              </div>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full bg-white text-primary hover:bg-white/90 font-black uppercase tracking-widest h-12 mt-4"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Simpan Perubahan
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">💡 Tips Loyalty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 leading-relaxed italic">
              &quot;Gunakan ambang batas yang realistis agar pelanggan merasa hadiah tersebut dapat dicapai, namun tetap menguntungkan bisnis Anda.&quot;
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
