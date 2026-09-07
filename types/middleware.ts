import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role as string | undefined;

    // ── Halaman khusus super_admin ────────────────────────────────────────────
    const superAdminOnly = ['/outlets', '/users', '/settings/loyalty'];
    if (superAdminOnly.some(p => pathname.startsWith(p)) && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // ── /mitra — split antara list (super_admin only) vs commission ───────────
    if (pathname.startsWith('/mitra')) {
      // /mitra/commission → boleh untuk super_admin dan mitra
      if (pathname.startsWith('/mitra/commission')) {
        if (role === 'super_admin' || role === 'mitra') return NextResponse.next();
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      // /mitra (list, detail, dll) → super_admin only
      if (role !== 'super_admin') {
        // Mitra coba akses /mitra → redirect ke komisinya sendiri
        if (role === 'mitra') {
          return NextResponse.redirect(new URL('/mitra/commission', req.url));
        }
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // ── Halaman yang TIDAK boleh diakses mitra ────────────────────────────────
    const blockedForMitra = [
      '/settings',     // pengaturan sistem
      '/services',     // kelola layanan & harga
      '/outlets',      // sudah di-handle superAdminOnly di atas
      '/reports',      // laporan keuangan
      '/users',        // manajemen user
      '/loyalty',      // loyalty & voucher
    ];
    if (role === 'mitra' && blockedForMitra.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // ── Halaman yang TIDAK boleh diakses admin ────────────────────────────────
    const blockedForAdmin = [
      '/outlets',
      '/users',
      '/settings/loyalty',
    ];
    if (role === 'admin' && blockedForAdmin.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // ── /scan — mitra boleh akses, tapi /scan/[id] sudah read-only di page ───
    // Tidak perlu block, sudah ditangani di page level

    return NextResponse.next();
  },
  {
    callbacks: {
      // Semua route di matcher wajib login
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/transactions/:path*',
    '/scan/:path*',
    '/customers/:path*',
    '/outlets/:path*',
    '/mitra/:path*',
    '/services/:path*',
    '/reports/:path*',
    '/users/:path*',
    '/settings/:path*',
    '/loyalty/:path*',
    '/laundry/:path*',
    '/paket-layanan/:path*',
    '/broadcast-wa/:path*',
    '/custom-invoice/:path*',
    '/payment-methods/:path*',
    '/audit-log/:path*',
    '/notifications/:path*',
  ],
};