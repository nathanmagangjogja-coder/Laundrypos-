'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { registerMitra } from '@/app/actions/mitra-accounts';
import {
  Loader2, ArrowRight, Shirt, CheckCircle2, Building2, User,
  Mail, Phone, MapPin, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const BENEFITS = [
  'Proses pendaftaran cepat & mudah',
  'Akses dashboard penuh setelah disetujui',
  'Sistem bagi hasil (komisi) yang transparan',
  'Bantuan teknis 24/7 untuk operasional',
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', owner: '', email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await registerMitra({
      name: form.name,
      owner_name: form.owner,
      email: form.email,
      phone: form.phone,
      address: form.address,
    });
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success('Pendaftaran mitra terkirim. Menunggu approval Super Admin.');
    setTimeout(() => router.push('/login'), 1200);
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-12 bg-background overflow-hidden">

      {/* ── Left: Branding — sama persis dengan halaman login ──
          Palet biru, disamakan dengan sidebar dashboard:
          #1d4ed8 (blue-700) → #1e40af (blue-800) → #1e3a8a (blue-900) */}
      <div
        className="hidden lg:flex lg:col-span-7 flex-col justify-between relative p-12 text-white overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 45%, #1e3a8a 100%)' }}
      >
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[520px] h-[520px] bg-sky-400/25 rounded-full blur-3xl opacity-60 animate-float" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[420px] h-[420px] bg-blue-500/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-cyan-400/10 rounded-full blur-2xl opacity-40" />

        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(135deg, white 0, white 1px, transparent 1px, transparent 26px)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="absolute top-24 left-16 w-40 h-40 rounded-full border border-sky-300/20 pointer-events-none" />
        <div className="absolute bottom-40 right-24 w-28 h-28 rounded-full border border-blue-300/15 pointer-events-none" />

        <div className="relative z-10 animate-fade-in">
          <Link href="/login" className="flex items-center gap-3 mb-14 group">
            <div
              className="relative grid h-12 w-12 place-items-center rounded-2xl shadow-lg ring-1 ring-white/20 group-hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #2563eb, #38bdf8)', boxShadow: '0 10px 28px -8px rgba(37,99,235,0.55)' }}
            >
              <Shirt className="h-7 w-7 text-white" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/25 to-transparent" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tighter uppercase italic">LaundryPOS</div>
              <div className="text-[10px] font-bold tracking-[0.25em] uppercase bg-gradient-to-r from-sky-300 to-blue-300 bg-clip-text text-transparent">
                Premium Edition
              </div>
            </div>
          </Link>

          <div className="max-w-xl space-y-6">
            <h1 className="text-5xl font-black leading-[1.1] tracking-tight animate-fade-in-up">
              Bergabung Menjadi{' '}
              <span className="italic bg-gradient-to-r from-sky-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                Mitra
              </span>{' '}
              Kami.
            </h1>
            <p className="text-lg text-slate-200 leading-relaxed animate-fade-in-up delay-100">
              Kelola bisnis laundry Anda lebih profesional dengan dukungan ekosistem digital dan sistem komisi yang transparan.
            </p>

            <div className="space-y-3 pt-4 animate-fade-in-up delay-200">
              {BENEFITS.map((text, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/8 backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
                >
                  <div className="h-7 w-7 rounded-xl bg-sky-400/15 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-sky-300" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-white/60 border-t border-white/15 pt-5">
          <div>© {new Date().getFullYear()} LaundryPOS · Membantu 500+ Outlet Laundry di Indonesia</div>
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div className="lg:col-span-5 flex items-center justify-center min-h-screen p-6 lg:p-10 bg-slate-50 dark:bg-background relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-sky-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-64 h-64 bg-blue-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-lg space-y-6 animate-fade-in-up relative z-10">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: 'linear-gradient(135deg, #2563eb, #38bdf8)' }}>
              <Shirt className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black italic tracking-tighter">LaundryPOS</span>
          </div>

          <div className="flex items-center gap-2 justify-center lg:justify-start">
            <span className="h-px w-6 bg-gradient-to-r from-transparent to-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-500 dark:text-blue-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Pendaftaran Mitra
            </span>
            <span className="h-px w-6 bg-gradient-to-l from-transparent to-blue-400" />
          </div>
          <div className="space-y-1 text-center lg:text-left">
            <h2 className="text-3xl font-black tracking-tight">
              Daftar Sebagai{' '}
              <span className="bg-gradient-to-r from-blue-600 to-sky-600 dark:from-blue-300 dark:to-sky-400 bg-clip-text text-transparent">
                Mitra
              </span>
            </h2>
            <p className="text-muted-foreground text-sm">Lengkapi formulir untuk memulai kerja sama.</p>
          </div>

          <div className="relative rounded-2xl border bg-white dark:bg-card shadow-xl shadow-blue-900/5 dark:shadow-none p-7 pt-8 space-y-5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400" />

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3 w-3" /> Nama Laundry
                </Label>
                <Input
                  required
                  placeholder="Contoh: Berkah Laundry"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-11 rounded-xl bg-slate-50 dark:bg-muted/30 border-border/60 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3 w-3" /> Nama Pemilik
                </Label>
                <Input
                  required
                  placeholder="Nama lengkap Anda"
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                  className="h-11 rounded-xl bg-slate-50 dark:bg-muted/30 border-border/60 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3" /> Email Bisnis
                </Label>
                <Input
                  type="email"
                  required
                  placeholder="email@bisnisanda.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-11 rounded-xl bg-slate-50 dark:bg-muted/30 border-border/60 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3 w-3" /> No. WhatsApp
                </Label>
                <Input
                  required
                  inputMode="numeric"
                  placeholder="0812xxxxxxx"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                  className="h-11 rounded-xl bg-slate-50 dark:bg-muted/30 border-border/60 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> Alamat Lengkap
                </Label>
                <Input
                  required
                  placeholder="Jl. Kenangan No. 123, Jakarta"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="h-11 rounded-xl bg-slate-50 dark:bg-muted/30 border-border/60 focus:border-blue-500 transition-all"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-bold text-sm text-white border-0 hover:scale-[1.02] active:scale-[0.98] transition-all"
                style={{
                  background: 'linear-gradient(90deg, #1d4ed8, #2563eb, #38bdf8)',
                  boxShadow: '0 10px 24px -8px rgba(37,99,235,0.45)',
                }}
                disabled={loading}
              >
                {loading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</>
                  : <><ArrowRight className="mr-2 h-4 w-4" /> Daftar Sebagai Mitra</>
                }
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">Masuk di sini</Link>
          </p>

          <p className="text-center text-[10px] text-muted-foreground/70 max-w-lg mx-auto">
            Dengan mendaftar, Anda menyetujui Syarat & Ketentuan serta Kebijakan Privasi LaundryPOS.
            Data Anda akan diverifikasi dalam waktu maksimal 1x24 jam.
          </p>
        </div>
      </div>
    </div>
  );
}