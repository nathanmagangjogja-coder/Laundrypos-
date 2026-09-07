import type { LaundryStatus, PaymentStatus } from '@/types';

export const LAUNDRY_STATUSES: { value: LaundryStatus; label: string; color: string }[] = [
  { value: 'diterima',  label: 'Diterima',      color: 'bg-blue-500/10 text-blue-700 border border-blue-500/25 dark:bg-blue-500/15 dark:text-blue-300' },
  { value: 'dicuci',    label: 'Dicuci',        color: 'bg-cyan-500/10 text-cyan-700 border border-cyan-500/25 dark:bg-cyan-500/15 dark:text-cyan-300' },
  { value: 'disetrika', label: 'Disetrika',     color: 'bg-amber-500/10 text-amber-700 border border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300' },
  { value: 'selesai',   label: 'Selesai',       color: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300' },
  { value: 'diambil',   label: 'Sudah Diambil', color: 'bg-slate-500/10 text-slate-700 border border-slate-500/25 dark:bg-slate-500/15 dark:text-slate-300' },
];

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string; color: string }[] = [
  { value: 'lunas',       label: 'Lunas',       color: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300' },
  { value: 'belum_lunas', label: 'Belum Lunas', color: 'bg-rose-500/10 text-rose-700 border border-rose-500/25 dark:bg-rose-500/15 dark:text-rose-300' },
  { value: 'dp',          label: 'DP',          color: 'bg-amber-500/10 text-amber-700 border border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300' },
];

export const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin',       label: 'Admin Laundry' },
  { value: 'mitra',       label: 'Mitra Laundry' },
];

export const WA_TEMPLATES = {
  // ─── FIX: baseUrl diterima sebagai parameter, bukan ambil dari window ───
  newOrder: (name: string, inv: string, total: number, est: string, baseUrl?: string) => {
    const origin = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '');
    const trackUrl = origin ? `${origin}/track/${inv}` : `/track/${inv}`;
    return `Halo *${name}* 👋\n\nTerima kasih telah menggunakan jasa *LaundryPOS* ✨\n\n🧾 *Invoice:* ${inv}\n💰 *Total:* Rp ${total.toLocaleString('id-ID')}\n⏱ *Estimasi selesai:* ${est}\n\n🔍 Lacak status:\n${trackUrl}\n\n_Pesan otomatis dari LaundryPOS_`;
  },

  ready: (name: string, inv: string) =>
    `Halo *${name}* 👋\n\n✅ Laundry dengan invoice:\n\n*${inv}*\n\nsudah *SELESAI* dan siap diambil 🙏\n\n📍 Silakan datang ke outlet atau hubungi petugas jika ingin diantar.\n\n_Pesan otomatis dari LaundryPOS_`,

  reminder: (name: string, inv: string) =>
    `Halo *${name}* 🔔\n\nLaundry Anda (invoice *${inv}*) sudah selesai. Mohon untuk diambil ya. Terima kasih!`,
};