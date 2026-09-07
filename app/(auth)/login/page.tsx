'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Shirt, Loader2, CheckCircle2, Star, Zap,
  Shield, ArrowRight, Smartphone, LayoutDashboard,
  Database, Eye, EyeOff, WashingMachine, Mail, Lock,
  Sparkles, Droplets, Info, PhoneCall, MessageCircleQuestion,
} from 'lucide-react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const FEATURES = [
  { icon: Zap,             text: 'Manajemen Cepat & Efisien',  color: 'text-sky-400'   },
  { icon: Smartphone,      text: 'Optimasi Tampilan Mobile',    color: 'text-blue-400'  },
  { icon: Shield,          text: 'Data Aman di Cloud',          color: 'text-cyan-300'  },
  { icon: LayoutDashboard, text: 'Dashboard Multi-Outlet',      color: 'text-blue-300'  },
];

const STATS = [
  { value: '120+', label: 'Outlet Aktif' },
  { value: '18K+', label: 'Transaksi/bulan' },
  { value: '4.9★', label: 'Rating Mitra' },
];

const DEMO_ACCOUNTS = [
  { email: 'superadmin@laundry.id', role: 'Super Admin', icon: Star,            accent: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-300 border-blue-200 dark:border-blue-500/20' },
  { email: 'admin@laundry.id',      role: 'Admin',       icon: LayoutDashboard, accent: 'text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-300 border-sky-200 dark:border-sky-500/20' },
  { email: 'mitra@laundry.id',      role: 'Mitra',       icon: Shield,          accent: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/20' },
];

const REMEMBER_KEY = 'lpos_remember_email';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(REMEMBER_KEY) : null;
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (result?.error) { toast.error('Email atau password salah'); return; }

    if (typeof window !== 'undefined') {
      if (remember) localStorage.setItem(REMEMBER_KEY, email);
      else localStorage.removeItem(REMEMBER_KEY);
    }

    toast.success('Selamat datang kembali!');
    router.push(params.get('from') || '/dashboard');
    router.refresh();
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword('password');
    toast.info(`Demo: ${demoEmail}`);
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-12 bg-background overflow-hidden">

      {/* ── Left: Branding — tema biru, khusus halaman auth.
          Disamakan dengan sidebar dashboard:
          #1d4ed8 (blue-700) → #1e40af (blue-800) → #1e3a8a (blue-900) ── */}
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
          <div className="flex items-center gap-3 mb-10">
            <div
              className="relative grid h-12 w-12 place-items-center rounded-2xl shadow-lg ring-1 ring-white/20"
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
          </div>

          <div className="max-w-xl space-y-5">
            <h1 className="text-5xl font-black leading-[1.1] tracking-tight animate-fade-in-up">
              Solusi{' '}
              <span className="italic bg-gradient-to-r from-sky-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                Smart
              </span>
              <br />
              Bisnis Laundry<br />
              <span className="text-slate-200">Modern.</span>
            </h1>
            <p className="text-lg text-slate-200 leading-relaxed animate-fade-in-up delay-100">
              Tingkatkan efisiensi outlet dengan sistem POS terintegrasi, manajemen pelanggan, dan tracking realtime.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-3 animate-fade-in-up delay-200">
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/8 backdrop-blur-sm hover:bg-white/10 transition-all duration-200 group"
                >
                  <div className="h-8 w-8 rounded-xl bg-white/8 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                    <f.icon className={cn('h-4 w-4', f.color)} />
                  </div>
                  <span className="text-sm font-medium text-slate-300">{f.text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-8 pt-1 animate-fade-in-up delay-200">
              {STATS.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && <span className="h-6 w-px bg-white/10 -ml-4 mr-1" />}
                  <div>
                    <div className="text-xl font-black bg-gradient-to-r from-sky-300 to-blue-200 bg-clip-text text-transparent">
                      {s.value}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-300 font-semibold">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: Tentang Kami + Kontak Super Admin */}
        <div className="relative z-10 space-y-4 animate-fade-in delay-300">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm max-w-md space-y-2.5">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-sky-300" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-300">Tentang LaundryPOS</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              LaundryPOS adalah sistem manajemen laundry berbasis cloud untuk usaha multi-outlet —
              mencakup transaksi, tracking cucian realtime, program loyalitas, dan manajemen mitra
              dalam satu platform.
            </p>
            <div className="flex items-center gap-2 pt-1.5 border-t border-white/10">
              <PhoneCall className="h-3.5 w-3.5 text-sky-300 shrink-0" />
              <span className="text-[11px] text-slate-300">
                Butuh bantuan akses akun? Hubungi <span className="text-slate-200 font-semibold">Super Admin</span> di{' '}
                <a href="mailto:superadmin@laundry.id" className="text-sky-300 hover:underline">superadmin@laundry.id</a>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/60 border-t border-white/15 pt-4">
            <div>© {new Date().getFullYear()} LaundryPOS · All Rights Reserved</div>
            <div className="flex gap-4">
              <Link href="#" className="hover:text-white/90 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white/90 transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Login Form ── */}
      <div className="lg:col-span-5 flex items-center justify-center min-h-screen p-6 lg:p-10 bg-slate-50 dark:bg-background relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-sky-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-64 h-64 bg-blue-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md space-y-5 animate-fade-in-up relative z-10">

          <div className="lg:hidden flex items-center gap-2 justify-center mb-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: 'linear-gradient(135deg, #2563eb, #38bdf8)' }}>
              <Shirt className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black italic tracking-tighter">LaundryPOS</span>
          </div>

          <div className="flex items-center gap-2 justify-center lg:justify-start">
            <span className="h-px w-6 bg-gradient-to-r from-transparent to-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-500 dark:text-blue-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Selamat Datang
            </span>
            <span className="h-px w-6 bg-gradient-to-l from-transparent to-blue-400" />
          </div>
          <div className="space-y-1 text-center lg:text-left">
            <h2 className="text-3xl font-black tracking-tight">
              Masuk ke{' '}
              <span className="bg-gradient-to-r from-blue-600 to-sky-600 dark:from-blue-300 dark:to-sky-400 bg-clip-text text-transparent">
                Dashboard
              </span>
            </h2>
            <p className="text-muted-foreground text-sm">Kelola operasional laundry Anda, kapan saja.</p>
          </div>

          <div className="relative rounded-2xl border bg-white dark:bg-card shadow-xl shadow-blue-900/5 dark:shadow-none p-7 pt-8 space-y-5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400" />

            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500/70 pointer-events-none" />
                  <Input
                    type="email"
                    required
                    placeholder="nama@laundry.id"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-11 rounded-xl bg-slate-50 dark:bg-muted/30 border-border/60 focus:border-blue-500 pl-10 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
                  <Link href="#" className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-wide">
                    Lupa Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500/70 pointer-events-none" />
                  <Input
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-11 rounded-xl bg-slate-50 dark:bg-muted/30 border-border/60 focus:border-blue-500 pl-10 pr-10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-border text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-muted-foreground">Ingat email saya</span>
              </label>

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
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Masuk...</>
                  : <><ArrowRight className="mr-2 h-4 w-4" /> Masuk Sekarang</>
                }
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-card px-3 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  Akun Demo
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center flex items-center justify-center gap-1">
                <Droplets className="h-3 w-3 text-blue-500" /> Klik untuk isi otomatis · Password: <span className="font-mono normal-case">password</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map(acc => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillDemo(acc.email)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md text-center',
                      acc.accent,
                    )}
                  >
                    <acc.icon className="h-4 w-4" />
                    <span className="text-[11px] font-bold leading-tight">{acc.role}</span>
                    <span className="text-[9px] font-mono opacity-70 truncate w-full">{acc.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tentang & Kontak — versi ringkas untuk layar kecil / mobile */}
          <div className="lg:hidden rounded-xl border bg-muted/30 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tentang LaundryPOS</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sistem manajemen laundry berbasis cloud untuk usaha multi-outlet.
            </p>
            <div className="flex items-center gap-1.5 pt-1.5 border-t">
              <MessageCircleQuestion className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span className="text-[11px] text-muted-foreground">
                Butuh bantuan? Hubungi Super Admin di{' '}
                <a href="mailto:superadmin@laundry.id" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">superadmin@laundry.id</a>
              </span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Belum punya akun?{' '}
            <Link href="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">Daftar sebagai Mitra</Link>
          </p>

          <div className="flex items-center justify-center gap-6 opacity-25 hover:opacity-60 transition-opacity">
            <WashingMachine className="h-5 w-5" />
            <Smartphone className="h-5 w-5" />
            <Database className="h-5 w-5" />
            <Shield className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}