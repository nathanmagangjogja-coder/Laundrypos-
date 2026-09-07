# LaundryPOS

SaaS POS modern untuk laundromat / laundry kiloan. Multi-outlet, multi-role (Super Admin / Admin Laundry / Mitra), tracking customer realtime, WhatsApp integration, barcode & QR code, nota thermal & PDF, PWA-ready.

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- TailwindCSS + shadcn/ui
- Supabase (DB + auth) — opsional
- NextAuth (JWT) — multi role
- Recharts, jsbarcode, qrcode.react, jspdf, xlsx

## Quick Start (Dummy Mode)

```bash
npm install
cp .env.local.example .env.local
# Pastikan NEXT_PUBLIC_USE_DUMMY=true (default)
npm run dev
```

Buka http://localhost:3000 → login dengan akun dummy:

| Role        | Email                  | Password |
|-------------|------------------------|----------|
| Super Admin | superadmin@laundry.id  | password |
| Admin       | admin@laundry.id       | password |
| Mitra       | mitra@laundry.id       | password |

## Setup Supabase (Production)

1. Buat project di https://supabase.com
2. Jalankan `supabase/schema.sql` di SQL Editor
3. (Opsional) jalankan `supabase/seed.sql` untuk dummy data
4. Salin URL & keys ke `.env.local`
5. Set `NEXT_PUBLIC_USE_DUMMY=false`

## WhatsApp Gateway

Mendukung Fonnte / Wablas. Isi `WHATSAPP_API_URL` dan `WHATSAPP_API_TOKEN` di `.env.local`, atau atur via menu **Pengaturan → WhatsApp**.

## Deploy ke Vercel

```bash
vercel
```

Set semua env di Vercel dashboard.

## Halaman

- `/login`, `/register`
- `/dashboard` — statistik & chart
- `/transactions`, `/transactions/new`, `/transactions/[id]`
- `/customers`, `/customers/[id]`
- `/outlets`, `/mitra`, `/mitra/commission`
- `/services`, `/reports`, `/users`
- `/settings`, `/settings/whatsapp`
- `/track/[invoice]` — public tracking page

## Cetak Nota

InvoicePrint mendukung CSS `@page` untuk thermal **58mm** & **80mm**, juga export PDF via `lib/pdf.ts`.

## Lisensi
MIT
