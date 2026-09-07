import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { NextAuthProvider } from '@/components/providers/NextAuthProvider';
import { Toaster } from 'sonner';
import { cn } from '@/lib/utils';

// ── Font ───────────────────────────────────────────────────────────────────
// CATATAN: sebelumnya pakai next/font/google (Plus Jakarta Sans), tapi ini
// men-download file font dari fonts.gstatic.com SAAT BUILD/DEV. Kalau jaringan
// tidak bisa akses Google Fonts (firewall kantor/kampus, offline, dll),
// SELURUH dashboard 500 — font dekoratif tidak boleh bisa merusak seluruh app.
// Solusi: pakai system font stack native (tanpa fetch jaringan sama sekali),
// tetap terlihat modern & profesional karena browser modern sudah punya
// font UI bawaan yang bagus (SF Pro/Segoe UI/Roboto/dst tergantung OS).
// Kalau nanti mau font custom lagi, download file .woff2-nya manual, taruh di
// /public/fonts, lalu load pakai next/font/local (tidak butuh jaringan sama sekali).

export const metadata: Metadata = {
  title: 'LaundryPOS — Modern Laundry Management',
  description: 'SaaS POS untuk laundromat modern. Multi-outlet, tracking realtime, WhatsApp integration.',
  manifest: '/manifest.json',
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' },
  // Hanya openGraph yang penting untuk SEO, twitter card opsional
  openGraph: {
    title: 'LaundryPOS — Modern Laundry Management',
    description: 'SaaS POS untuk laundromat modern.',
    url: 'https://laundrypos.id',
    siteName: 'LaundryPOS',
    locale: 'id_ID',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn('dark font-sans')}
    >
      <head>
        {/* DNS prefetch untuk Supabase & WhatsApp */}
        <link rel="dns-prefetch" href="https://api.whatsapp.com" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''} />
      </head>
      <body
        suppressHydrationWarning
        className="bg-background text-foreground antialiased min-h-screen"
      >
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}