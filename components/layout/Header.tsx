'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Bell, LogOut, Moon, Search, Sun, User,
  Shirt, Settings, LogOut as LogoutIcon, MessageCircle,
  ChevronDown, PanelLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAuth, logout } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatRupiah, cn, getRelativeTime, openWa } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Commission, Transaction } from '@/types';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  onOpenPalette?: () => void;
}

export function Header({ onToggleSidebar, sidebarOpen, onOpenPalette }: HeaderProps) {
  const router = useRouter();
  const { isDark, mounted, toggle } = useDarkMode();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const pathname = usePathname();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);

  const breadcrumbs = useMemo(() => {
    const paths = pathname.split('/').filter(p => p);
    return paths.map((p, i) => {
      const label = p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ');
      const href = '/' + paths.slice(0, i + 1).join('/');
      return { label, href };
    });
  }, [pathname]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [txns, comms] = await Promise.all([
        api.listTransactions(),
        user?.role === 'mitra' || user?.role === 'super_admin'
          ? api.listCommissions()
          : Promise.resolve([]),
      ]);
      setTransactions(txns || []);
      setCommissions(comms || []);
    } catch (error) {
      console.error('[LOAD_DATA_ERROR]:', error);
    }
  }, [userId, user?.role]);

  useEffect(() => {
    if (!userId) return;
    loadData();
    const id = setInterval(loadData, 60000);
    return () => clearInterval(id);
  }, [userId, loadData]);

  const derivedNotifications = useMemo(() => {
    if (!user) return [];
    const items: any[] = [];

    const overdue = transactions.filter(
      t => t.status !== 'diambil' && t.est_done_at && new Date(t.est_done_at) < new Date()
    );
    if (overdue.length > 0) {
      items.push({
        id: 'overdue',
        title: `${overdue.length} Order Terlambat`,
        message: 'Ada order yang melewati estimasi selesai.',
        type: 'error',
        created_at: new Date().toISOString(),
        is_read: false,
        link: '/transactions',
      });
    }

    const unpaid = transactions.filter(t => t.payment_status !== 'lunas');
    if (unpaid.length > 0) {
      const unpaidTotal = unpaid.reduce((s, t) => s + (t.total - t.paid), 0);
      items.push({
        id: 'unpaid',
        title: 'Piutang Aktif',
        message: `Total ${formatRupiah(unpaidTotal)} belum lunas.`,
        type: 'warning',
        created_at: new Date().toISOString(),
        is_read: false,
        link: '/reports',
      });
    }

    const combinedRecent = [
      ...transactions.map(t => ({
        id: t.id,
        title: t.customer_name || 'Customer Umum',
        message: `${t.invoice_no} - ${t.status.toUpperCase()}`,
        type: t.payment_status === 'lunas' ? 'success' : 'info',
        created_at: t.created_at,
        is_read: true,
        link: `/transactions/${t.id}`,
      })),
      ...commissions.map(c => ({
        id: `comm-${c.id}`,
        title: 'Komisi',
        message: `Komisi sebesar ${formatRupiah(c.amount)}`,
        type: 'success',
        created_at: c.created_at,
        is_read: true,
        link: '/mitra/commission',
      })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return [...items, ...combinedRecent];
  }, [transactions, commissions, user]);

  const unreadCount = derivedNotifications.filter(n => !n.is_read).length;

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) logout();
  };

  return (
    <header className={cn(
      'sticky top-0 z-50 flex h-14 items-center gap-4 px-4 md:px-6',
      'border-b transition-all duration-500 relative overflow-hidden',
      'bg-white/95 dark:bg-background/95 backdrop-blur-md',
      'border-primary/15',
    )}>

      {/* Garis pelangi di paling atas */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary via-sky-400 to-emerald-400 opacity-90 pointer-events-none" />

      {/* Blob biru kiri */}
      <div className="absolute left-0 top-0 h-full w-80 bg-gradient-to-r from-primary/10 via-sky-400/5 to-transparent pointer-events-none" />

      {/* Blob hijau kanan */}
      <div className="absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-emerald-400/8 via-teal-400/5 to-transparent pointer-events-none" />

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* ── Sidebar Toggle & Breadcrumbs ── */}
      <div className="relative flex items-center gap-2 md:gap-3 overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-9 w-9 flex shrink-0 transition-all duration-200',
            sidebarOpen
              ? 'text-foreground bg-primary/10 hover:bg-primary/15'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'}
        >
          <PanelLeft className="h-5 w-5" />
        </Button>

        <nav className="flex items-center gap-1.5 md:gap-2 text-sm font-medium text-muted-foreground overflow-hidden">
          <Link href="/dashboard" className="flex items-center gap-2 hover:text-foreground transition-colors shrink-0">
            <Shirt className="h-5 w-5 text-primary" />
            <span className="sm:block hidden font-bold text-foreground tracking-tight">LaundryPOS</span>
          </Link>
          {breadcrumbs.map((b, i) => (
            <div key={b.href} className="flex items-center gap-1.5 md:gap-2 overflow-hidden shrink-0">
              <span className="text-muted-foreground/30 text-xs">/</span>
              {i === breadcrumbs.length - 1 ? (
                <span className="truncate max-w-[70px] sm:max-w-[120px] md:max-w-none text-xs sm:text-sm text-foreground font-bold">
                  {b.label}
                </span>
              ) : (
                <Link
                  href={b.href}
                  className="truncate max-w-[70px] sm:max-w-[120px] md:max-w-none text-xs sm:text-sm hover:text-foreground transition-colors"
                >
                  {b.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* ── Right Actions ── */}
      <div className="relative ml-auto flex items-center gap-1 md:gap-2">

        {/* Command Palette Trigger */}
        {onOpenPalette && (
          <button
            onClick={onOpenPalette}
            className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg select-none
                       text-xs text-muted-foreground
                       bg-white/60 dark:bg-muted/40 hover:bg-white dark:hover:bg-muted
                       border border-border/60 hover:border-primary/30
                       shadow-sm hover:shadow-primary/10
                       transition-all duration-150 group"
            aria-label="Buka command palette (⌘K)"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="w-[52px] text-left">Cari...</span>
            <span className="flex items-center gap-0.5 opacity-50 group-hover:opacity-80 transition-opacity">
              <kbd className="h-4 px-1 rounded text-[9px] font-mono bg-muted border border-border">⌘</kbd>
              <kbd className="h-4 px-1 rounded text-[9px] font-mono bg-muted border border-border">K</kbd>
            </span>
          </button>
        )}

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground hover:bg-primary/8"
        >
          {!mounted ? (
            <div className="h-5 w-5 animate-pulse rounded-full bg-muted" />
          ) : isDark ? (
            <Sun className="h-5 w-5 text-amber-500" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* WhatsApp Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
          onClick={() => openWa('628123456789', `Halo, saya ${user?.name}. Ingin bertanya mengenai :.`)}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground hover:bg-primary/8"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] md:w-80 bg-popover border-border">
            <DropdownMenuLabel className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">Notifikasi</span>
                <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider">Laundry POS</span>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => toast.success('Semua notifikasi ditandai dibaca')}
                  className="text-[10px] text-primary hover:text-primary/80 font-medium"
                >
                  Tandai semua dibaca
                </button>
              )}
            </DropdownMenuLabel>
            <div className="max-h-[70vh] overflow-y-auto">
              {derivedNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <div className="mb-2 rounded-full bg-muted p-3">
                    <Bell className="h-6 w-6 text-muted-foreground opacity-20" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Tidak ada notifikasi</p>
                </div>
              ) : (
                derivedNotifications.map((n) => {
                  const colors: Record<string, string> = {
                    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                    error:   'bg-rose-500/10 text-rose-600 dark:text-rose-400',
                    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                    info:    'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
                  };
                  return (
                    <DropdownMenuItem
                      key={n.id}
                      className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted border-b border-border last:border-0 relative"
                      onClick={() => n.link && router.push(n.link)}
                    >
                      {!n.is_read && (
                        <div className="absolute right-2 top-4 h-2 w-2 rounded-full bg-primary" />
                      )}
                      <div className={cn('mt-0.5 rounded-lg p-2 shrink-0', colors[n.type] || colors.info)}>
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1 pr-4 text-left">
                        <div className="text-sm font-semibold leading-none text-foreground">{n.title}</div>
                        <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{n.message}</div>
                        <div className="text-[10px] text-muted-foreground/60">{getRelativeTime(n.created_at)}</div>
                      </div>
                    </DropdownMenuItem>
                  );
                })
              )}
            </div>
            <DropdownMenuSeparator />
            <Link href="/notifications" className="block py-2 text-center text-xs font-medium text-primary hover:underline">
              Lihat semua notifikasi
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Pill */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'h-10 gap-2.5 pl-1.5 pr-2.5 rounded-full shrink-0 transition-all',
                'border-primary/20 hover:border-primary/40',
                'bg-white/70 dark:bg-muted/30 hover:bg-white dark:hover:bg-muted/50',
                'shadow-sm hover:shadow-primary/15',
              )}
              disabled={authLoading}
            >
              {authLoading ? (
                <div className="h-7 w-7 animate-pulse rounded-full bg-muted" />
              ) : (
                <>
                  <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border-2 border-primary/30">
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary/80 text-[10px] font-bold text-primary-foreground">
                      {(user?.name ?? 'U').slice(0, 1).toUpperCase()}
                    </div>
                  </div>
                  <div className="hidden text-left md:block max-w-[150px]">
                    <div className="truncate text-xs font-bold leading-tight text-foreground">
                      {user?.name ?? 'User'}
                    </div>
                    <div className="truncate text-[9px] text-muted-foreground lowercase leading-tight">
                      {user?.email ?? 'email@laundrypos.id'}
                    </div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2 bg-popover border-border">
            <div className="flex items-center gap-3 p-3 border-b border-border mb-2">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-primary/20">
                {(user?.name ?? 'U').slice(0, 1).toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <p className="truncate text-sm font-bold text-foreground">{user?.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
                <div className="mt-1 w-fit px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold uppercase tracking-wider">
                  {user?.role}
                </div>
              </div>
            </div>
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="flex w-full items-center gap-2 rounded-lg py-2.5 cursor-pointer hover:bg-muted group">
                  <div className="rounded-md bg-muted p-1.5 text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Profil Saya</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex w-full items-center gap-2 rounded-lg py-2.5 cursor-pointer hover:bg-muted group">
                  <div className="rounded-md bg-muted p-1.5 text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                    <Settings className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Pengaturan</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg py-2.5 text-rose-500 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30 cursor-pointer group"
            >
              <div className="rounded-md bg-rose-500/10 p-1.5 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                <LogoutIcon className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold">Keluar Aplikasi</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}