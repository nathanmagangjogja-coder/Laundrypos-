'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Receipt, Users, Store, Handshake, Wrench,
  FileBarChart, UserCog, Settings, Shirt, QrCode, Gift, Star,
  Building2, ChevronsLeft, ChevronsRight, PlusCircle, WashingMachine,
  MessageCircle, PackageOpen, FileText,
  Wallet, ScrollText, LayoutDashboard, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const ROLE_META: Record<Role, { label: string; subtitle: string; dot: string }> = {
  super_admin: { label: 'Super Admin',   subtitle: 'Akses penuh semua outlet', dot: 'bg-violet-400' },
  admin:       { label: 'Admin Laundry', subtitle: 'Kelola outlet & transaksi', dot: 'bg-sky-400' },
  mitra:       { label: 'Mitra',         subtitle: 'Akses komisi & laporan mitra', dot: 'bg-emerald-400' },
};

// ─── Nav items ───────────────────
// Setiap item punya `color` unik agar ikon sidebar mudah dikenali per kategori.
const NAV_GROUPS = [
  {
    label: '',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#8b5cf6', roles: ['super_admin', 'admin', 'mitra'] as Role[] },
    ],
  },
  {
    label: 'Transaksi',
    items: [
      { href: '/transactions',     label: 'Transaksi',      icon: Receipt,         color: '#38bdf8', roles: ['super_admin', 'admin', 'mitra'] as Role[] },
      { href: '/transactions/new', label: 'Buat Transaksi', icon: PlusCircle,      color: '#34d399', roles: ['super_admin', 'admin'] as Role[] },
      { href: '/scan',             label: 'Scan / Kembali', icon: QrCode,          color: '#f472b6', roles: ['super_admin', 'admin', 'mitra'] as Role[] },
    ],
  },
  {
    label: 'Laundry',
    items: [
      { href: '/laundry', label: 'Antrian Laundry', icon: WashingMachine, color: '#22d3ee', roles: ['super_admin', 'admin', 'mitra'] as Role[] },
    ],
  },
  {
    label: 'Master Data',
    items: [
      { href: '/customers',        label: 'Customer',          icon: Users,        color: '#2dd4bf', roles: ['super_admin', 'admin', 'mitra'] as Role[] },
      { href: '/services',         label: 'Layanan & Harga',   icon: Wrench,       color: '#fbbf24', roles: ['super_admin', 'admin'] as Role[] },
      { href: '/broadcast-wa',     label: 'Broadcast WA',      icon: MessageCircle,color: '#4ade80', roles: ['super_admin', 'admin'] as Role[] },
      { href: '/loyalty',          label: 'Loyalty & Voucher', icon: Gift,         color: '#f43f5e', roles: ['super_admin', 'admin'] as Role[], badge: 'NEW' },
    ],
  },
  {
    label: 'Manajemen',
    items: [
      { href: '/outlets',          label: 'Kelola Outlet',     icon: Store,        color: '#818cf8', roles: ['super_admin'] as Role[] },
      { href: '/mitra',            label: 'Kelola Mitra',      icon: Building2,    color: '#a78bfa', roles: ['super_admin'] as Role[] },
      { href: '/mitra/commission', label: 'Komisi',            icon: Handshake,    color: '#e879f9', roles: ['super_admin'] as Role[] },
      { href: '/mitra/commission', label: 'Komisi Saya',       icon: Handshake,    color: '#e879f9', roles: ['mitra'] as Role[] },
      { href: '/users',            label: 'Kelola Pengguna',   icon: UserCog,      color: '#60a5fa', roles: ['super_admin'] as Role[] },
      { href: '/paket-layanan',    label: 'Paket Layanan',     icon: PackageOpen,  color: '#22d3ee', roles: ['super_admin'] as Role[] },
      { href: '/custom-invoice',   label: 'Custom Invoice',    icon: FileText,     color: '#fbbf24', roles: ['super_admin', 'admin'] as Role[] },
      { href: '/payment-methods',  label: 'Metode Pembayaran', icon: Wallet,       color: '#34d399', roles: ['super_admin'] as Role[] },
      { href: '/audit-log',        label: 'Audit Log',         icon: ScrollText,   color: '#94a3b8', roles: ['super_admin'] as Role[] },
      { href: '/settings/loyalty', label: 'Loyalty Settings',  icon: Star,         color: '#facc15', roles: ['super_admin'] as Role[] },
      { href: '/settings',         label: 'Pengaturan',        icon: Settings,     color: '#94a3b8', roles: ['super_admin', 'admin'] as Role[] },
    ],
  },
  {
    label: 'Laporan',
    items: [
      { href: '/reports',          label: 'Laporan',           icon: FileBarChart, color: '#fb7185', roles: ['super_admin', 'admin'] as Role[] },
    ],
  },
];

interface SidebarProps {
  role?: Role;
  loading?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ role, loading = false, isOpen = true, onToggle, mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const roleMeta = role ? ROLE_META[role] : null;

  if (loading) {
    return (
      <aside className={cn(
        'sidebar-fixed-theme hidden md:flex md:flex-col overflow-hidden transition-all duration-300 ease-in-out',
        'border-r',
        isOpen ? 'md:w-64' : 'md:w-0 border-r-0',
      )} style={{
        background: 'linear-gradient(180deg, var(--sb-bg-from), var(--sb-bg-via) 45%, var(--sb-bg-to))',
        borderColor: 'var(--sb-border)',
      }}>
        <div className="flex h-16 items-center gap-2 border-b px-6" style={{ borderColor: 'var(--sb-border)' }}>
          <div className="h-9 w-9 animate-pulse rounded-xl bg-white/10 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-16 animate-pulse rounded bg-white/5" />
          </div>
        </div>
        <div className="flex-1 space-y-1.5 p-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      </aside>
    );
  }

  // ── Konten sidebar yang dipakai bersama untuk versi desktop & drawer mobile ──
  function renderContent(opts: { showCollapseToggle: boolean; showCloseButton: boolean; onNavigate?: () => void }) {
    return (
      <>
        {/* Logo + toggle */}
        <div
          className="flex h-16 items-center gap-2 border-b px-4 shrink-0 relative overflow-hidden"
          style={{ borderColor: 'var(--sb-border)' }}
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 flex-1 min-w-0 group"
            onClick={() => { opts.onNavigate?.(); if (pathname === '/dashboard') window.location.reload(); }}
          >
            <div
              className="relative grid h-9 w-9 place-items-center rounded-xl shrink-0 shadow-lg transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, var(--sb-logo-from), var(--sb-logo-to))', boxShadow: '0 6px 16px -4px rgba(37,99,235,0.55)' }}
            >
              <Shirt className="h-5 w-5 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/25 to-transparent" />
            </div>
            <div className="overflow-hidden whitespace-nowrap min-w-0">
              <div className="font-bold leading-tight tracking-tight text-white truncate">
                LaundryPOS
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--sb-text-muted)' }}>
                System
              </div>
            </div>
          </Link>
          {opts.showCollapseToggle && onToggle && (
            <button
              onClick={onToggle}
              className="grid h-7 w-7 place-items-center rounded-lg shrink-0 transition-colors hover:bg-white/10"
              style={{ color: 'var(--sb-text-muted)' }}
              aria-label="Ciutkan sidebar"
            >
              {isOpen ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
            </button>
          )}
          {opts.showCloseButton && (
            <button
              onClick={onCloseMobile}
              className="grid h-7 w-7 place-items-center rounded-lg shrink-0 transition-colors hover:bg-white/10"
              style={{ color: 'var(--sb-text-muted)' }}
              aria-label="Tutup sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Role Badge */}
        {roleMeta && (
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--sb-border)' }}>
            <div className="flex items-center gap-1.5">
              <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', roleMeta.dot)} />
              <span className="text-xs font-bold uppercase tracking-wide text-white">{roleMeta.label}</span>
            </div>
            <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--sb-text-muted)' }}>
              {roleMeta.subtitle}
            </div>
          </div>
        )}

        {/* Nav Groups */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(i => !role || i.roles.includes(role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label || 'top'} className="mb-1">
                {group.label && (
                  <div
                    className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--sb-group-label)' }}
                  >
                    {group.label}
                  </div>
                )}
                <div className="px-2.5 space-y-0.5">
                  {visibleItems.map((item, idx) => {
                    const active = pathname === item.href ||
                      (item.href !== '/dashboard' && item.href !== '/mitra/commission' && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={`${item.href}-${idx}`}
                        href={item.href}
                        onClick={opts.onNavigate}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap"
                        style={active ? {
                          background: 'var(--sb-active-bg)',
                          color: 'var(--sb-text-active)',
                          boxShadow: `inset 3px 0 0 0 ${item.color}, 0 4px 14px -4px ${hexToRgba(item.color, 0.35)}`,
                        } : { color: 'var(--sb-text)' }}
                        onMouseEnter={(e) => {
                          if (active) return;
                          e.currentTarget.style.background = 'var(--sb-hover)';
                          e.currentTarget.style.boxShadow = `0 4px 14px -4px ${hexToRgba(item.color, 0.3)}`;
                        }}
                        onMouseLeave={(e) => {
                          if (active) return;
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <Icon className="h-4 w-4 shrink-0" style={{ color: active ? 'var(--sb-text-active)' : item.color }} />
                        <span className="truncate flex-1">{item.label}</span>
                        {'badge' in item && item.badge && !active && (
                          <span
                            className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ background: 'var(--sb-badge-bg)' }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className="border-t p-4 text-[11px] whitespace-nowrap overflow-hidden"
          style={{ borderColor: 'var(--sb-border)', color: 'var(--sb-text-muted)' }}
        >
          v1.1.0 · &copy; {new Date().getFullYear()} LaundryPOS
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── Desktop sidebar (collapsible, mendorong layout) ── */}
      <aside
        className={cn(
          'sidebar-fixed-theme hidden md:flex md:flex-col overflow-hidden transition-all duration-300 ease-in-out border-r',
          isOpen ? 'md:w-64' : 'md:w-0 border-r-0',
        )}
        style={{
          background: 'linear-gradient(180deg, var(--sb-bg-from), var(--sb-bg-via) 45%, var(--sb-bg-to))',
          borderColor: 'var(--sb-border)',
          color: 'var(--sb-text)',
        }}
      >
        {renderContent({ showCollapseToggle: true, showCloseButton: false })}
      </aside>

      {/* ── Mobile drawer (overlay, toggle via tombol di header) ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'sidebar-fixed-theme fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82vw] flex-col md:hidden',
          'transition-transform duration-300 ease-in-out shadow-2xl',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{
          background: 'linear-gradient(180deg, var(--sb-bg-from), var(--sb-bg-via) 45%, var(--sb-bg-to))',
          color: 'var(--sb-text)',
        }}
      >
        {renderContent({ showCollapseToggle: false, showCloseButton: true, onNavigate: onCloseMobile })}
      </aside>
    </>
  );
}