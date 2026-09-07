'use client';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { PageTransition } from '@/components/layout/PageTransition';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, QrCode } from 'lucide-react';
import Link from 'next/link';
import { useState, useCallback, useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const openPalette = useCallback(() => setPaletteOpen(true), []);

  // Tutup drawer sidebar mobile setiap kali berpindah halaman
  useEffect(() => { setMobileSidebarOpen(false); }, [pathname]);

  function handleToggleSidebar() {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      <Sidebar
        role={user?.role}
        loading={loading}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(prev => !prev)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onToggleSidebar={handleToggleSidebar}
          sidebarOpen={sidebarOpen}
          onOpenPalette={openPalette}
        />

        {/* Page transition wrapper — key berubah setiap navigasi */}
        <PageTransition key={pathname} className="flex-1 p-4 pb-24 md:p-6 md:pb-24 space-y-6">
          {children}
        </PageTransition>

        {/* Footer aplikasi — rapi & responsif */}
        <footer className="mt-auto px-4 py-4 md:px-6 border-t border-border/60 pb-24 md:pb-4">
          <div className="flex flex-col-reverse items-center gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="text-[11px] text-muted-foreground">
              LaundryPOS &copy; {new Date().getFullYear()} — Sistem Manajemen Laundry
            </p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">Tentang Aplikasi</Link>
              <span className="text-muted-foreground/30">|</span>
              <Link href="/notifications" className="hover:text-foreground transition-colors">Pesan Masuk</Link>
            </div>
          </div>
        </footer>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex flex-col gap-3">
          <div className="group flex items-center gap-3">
            <span className="pointer-events-none opacity-0 transition-opacity group-hover:opacity-100 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded shadow-lg hidden md:inline-block">
              Transaksi Baru
            </span>
            <Button asChild size="icon" className="h-12 w-12 md:h-14 md:w-14 rounded-full shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all duration-300 bg-primary hover:bg-primary/90">
              <Link href="/transactions/new"><Plus className="h-6 w-6" /></Link>
            </Button>
          </div>
          <div className="group hidden md:flex items-center gap-3">
            <span className="pointer-events-none opacity-0 transition-opacity group-hover:opacity-100 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded shadow-lg">
              Scan Barcode
            </span>
            <Button asChild variant="outline" size="icon" className="h-12 w-12 rounded-full shadow-xl bg-white dark:bg-slate-800 border-2 border-primary/20 hover:border-primary/50 hover:scale-110 active:scale-95 transition-all duration-300">
              <Link href="/scan"><QrCode className="h-5 w-5 text-primary" /></Link>
            </Button>
          </div>
        </div>
      </div>

      <MobileNav role={user?.role} loading={loading} />
    </div>
  );
}