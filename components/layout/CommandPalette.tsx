'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Receipt, Users, Store, Handshake, Wrench,
  FileBarChart, UserCog, Settings, QrCode, Gift, Star,
  Plus, Search, Moon, Sun, LogOut, ChevronRight,
  Shirt, Zap,
} from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { useAuth, logout } from '@/hooks/useAuth';
import { useDarkMode } from '@/hooks/useDarkMode';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type CmdGroup = 'action' | 'navigate' | 'system';

interface PaletteCommand {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  group: CmdGroup;
  roles: Role[];
  keywords?: string[];
  shortcut?: string[];
  iconColor?: string;
  onSelect: () => void;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// ─── Command builder (hook) ───────────────────────────────────────────────────

function useCommands(closeAndRun: (fn: () => void) => void): PaletteCommand[] {
  const router = useRouter();
  const { isDark, toggle } = useDarkMode();

  const nav = useCallback(
    (href: string) => closeAndRun(() => router.push(href)),
    [closeAndRun, router],
  );

  return [
    // ── Aksi Cepat ──────────────────────────────────────────────────────────
    {
      id: 'new-transaction',
      label: 'Transaksi Baru',
      sublabel: 'Buat pesanan laundry baru',
      icon: Plus,
      group: 'action',
      roles: ['super_admin', 'admin', 'mitra'],
      keywords: ['buat', 'pesanan', 'order', 'new', 'tambah'],
      shortcut: ['⌘', 'N'],
      iconColor: 'text-primary',
      onSelect: () => nav('/transactions/new'),
    },
    {
      id: 'scan-invoice',
      label: 'Scan Barcode',
      sublabel: 'Pindai atau cari nomor invoice',
      icon: QrCode,
      group: 'action',
      roles: ['super_admin', 'admin', 'mitra'],
      keywords: ['scan', 'barcode', 'qr', 'pindai', 'cari invoice'],
      shortcut: ['⌘', 'S'],
      iconColor: 'text-cyan-500',
      onSelect: () => nav('/scan'),
    },
    {
      id: 'search-customer',
      label: 'Cari Customer',
      sublabel: 'Buka daftar & cari pelanggan',
      icon: Search,
      group: 'action',
      roles: ['super_admin', 'admin', 'mitra'],
      keywords: ['cari', 'pelanggan', 'customer', 'nama'],
      iconColor: 'text-indigo-500',
      onSelect: () => nav('/customers'),
    },

    // ── Navigasi ─────────────────────────────────────────────────────────────
    { id: 'nav-dashboard',    label: 'Dashboard',          icon: LayoutDashboard, group: 'navigate', roles: ['super_admin','admin','mitra'], keywords: ['beranda','home'],                onSelect: () => nav('/dashboard') },
    { id: 'nav-transactions', label: 'Transaksi',          icon: Receipt,         group: 'navigate', roles: ['super_admin','admin','mitra'], keywords: ['order','pesanan','daftar'],      onSelect: () => nav('/transactions') },
    { id: 'nav-scan',         label: 'Scan Invoice',       icon: QrCode,          group: 'navigate', roles: ['super_admin','admin','mitra'], keywords: ['scan','qr','barcode'],           onSelect: () => nav('/scan') },
    { id: 'nav-customers',    label: 'Customer',           icon: Users,           group: 'navigate', roles: ['super_admin','admin','mitra'], keywords: ['pelanggan'],                     onSelect: () => nav('/customers') },
    { id: 'nav-loyalty',      label: 'Loyalty & Voucher',  icon: Gift,            group: 'navigate', roles: ['super_admin','admin'],         keywords: ['voucher','poin','reward'],       iconColor: 'text-emerald-500', onSelect: () => nav('/loyalty') },
    { id: 'nav-outlets',      label: 'Outlet',             icon: Store,           group: 'navigate', roles: ['super_admin'],                 keywords: ['cabang','toko','lokasi'],        onSelect: () => nav('/outlets') },
    { id: 'nav-mitra',        label: 'Mitra',              icon: Users,           group: 'navigate', roles: ['super_admin'],                 keywords: ['partner'],                      onSelect: () => nav('/mitra') },
    { id: 'nav-commission',   label: 'Komisi',             icon: Handshake,       group: 'navigate', roles: ['super_admin','mitra'],         keywords: ['commission','bayar'],            onSelect: () => nav('/mitra/commission') },
    { id: 'nav-services',     label: 'Layanan',            icon: Wrench,          group: 'navigate', roles: ['super_admin','admin'],         keywords: ['harga','tarif','services'],      onSelect: () => nav('/services') },
    { id: 'nav-reports',      label: 'Laporan',            icon: FileBarChart,    group: 'navigate', roles: ['super_admin','admin'],         keywords: ['report','statistik','analitik'], onSelect: () => nav('/reports') },
    { id: 'nav-users',        label: 'Users',              icon: UserCog,         group: 'navigate', roles: ['super_admin'],                 keywords: ['pengguna','akun','staf'],        onSelect: () => nav('/users') },
    { id: 'nav-settings',     label: 'Pengaturan',         icon: Settings,        group: 'navigate', roles: ['super_admin','admin'],         keywords: ['konfigurasi','settings'],        onSelect: () => nav('/settings') },
    { id: 'nav-loyalty-set',  label: 'Pengaturan Loyalty', icon: Star,            group: 'navigate', roles: ['super_admin'],                 keywords: ['loyalty settings','poin'],       onSelect: () => nav('/settings/loyalty') },

    // ── Sistem ───────────────────────────────────────────────────────────────
    {
      id: 'toggle-theme',
      label: isDark ? 'Tema Terang' : 'Tema Gelap',
      sublabel: isDark ? 'Ganti ke light mode' : 'Ganti ke dark mode',
      icon: isDark ? Sun : Moon,
      group: 'system',
      roles: ['super_admin', 'admin', 'mitra'],
      keywords: ['dark', 'light', 'tema', 'theme', 'mode'],
      shortcut: ['⌘', 'T'],
      iconColor: isDark ? 'text-amber-400' : 'text-slate-500',
      onSelect: () => closeAndRun(() => {
        toggle();
        toast.success(isDark ? '☀️ Tema terang' : '🌙 Tema gelap');
      }),
    },
    {
      id: 'logout',
      label: 'Keluar',
      sublabel: 'Logout dari akun ini',
      icon: LogOut,
      group: 'system',
      roles: ['super_admin', 'admin', 'mitra'],
      keywords: ['logout', 'keluar', 'signout'],
      iconColor: 'text-rose-500',
      onSelect: () => closeAndRun(() => {
        if (window.confirm('Yakin ingin keluar?')) logout();
      }),
    },
  ];
}

// ─── Group meta ───────────────────────────────────────────────────────────────

const GROUP_LABEL: Record<CmdGroup, string> = {
  action:   'Aksi Cepat',
  navigate: 'Navigasi',
  system:   'Sistem',
};
const GROUP_ORDER: CmdGroup[] = ['action', 'navigate', 'system'];

// ─── Single item ──────────────────────────────────────────────────────────────

function PaletteItem({ cmd }: { cmd: PaletteCommand }) {
  const Icon = cmd.icon;
  return (
    <CommandItem
      value={[cmd.label, cmd.sublabel ?? '', ...(cmd.keywords ?? [])].join(' ')}
      onSelect={cmd.onSelect}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer mx-1
                 data-[selected=true]:bg-muted group/item"
    >
      <div className={cn(
        'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
        'bg-muted/60 border border-transparent transition-all duration-100',
      )}>
        <Icon className={cn('h-4 w-4', cmd.iconColor ?? 'text-muted-foreground')} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium leading-none truncate',
          cmd.id === 'logout' && 'text-rose-500',
        )}>
          {cmd.label}
        </p>
        {cmd.sublabel && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{cmd.sublabel}</p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {cmd.shortcut
          ? cmd.shortcut.map((k, i) => (
              <kbd key={i} className="h-5 min-w-[1.25rem] px-1 rounded text-[10px] font-mono flex items-center justify-center bg-background border border-border text-muted-foreground">
                {k}
              </kbd>
            ))
          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 opacity-0 group-data-[selected=true]/item:opacity-100 transition-opacity" />
        }
      </div>
    </CommandItem>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function CommandPalette({ open: openProp, onOpenChange }: CommandPaletteProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => { setMounted(true); }, []);

  const isOpen = openProp ?? internalOpen;

  const setOpen = useCallback((val: boolean) => {
    setInternalOpen(val);
    onOpenChange?.(val);
  }, [onOpenChange]);

  const closeAndRun = useCallback((fn: () => void) => {
    setOpen(false);
    setTimeout(fn, 80);
  }, [setOpen]);

  const allCommands = useCommands(closeAndRun);
  const commands = allCommands.filter(
    c => !user?.role || c.roles.includes(user.role),
  );

  // Global Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, setOpen]);

  if (!mounted) return null;

  return (
    <CommandDialog open={isOpen} onOpenChange={setOpen}>
      <Command> {/* ← wajib: CommandDialog tidak include Command context */}

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Shirt className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <CommandInput
            placeholder="Ketik perintah atau nama halaman..."
            className="flex-1 border-0 p-0 h-auto shadow-none focus-visible:ring-0 text-sm"
          />
        </div>

        {/* List */}
        <CommandList className="max-h-[400px] p-1.5">
          <CommandEmpty>
            <div className="flex flex-col items-center py-10 gap-3 text-muted-foreground">
              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
                <Zap className="h-5 w-5 opacity-20" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Tidak ditemukan</p>
                <p className="text-xs opacity-50 mt-0.5">Coba kata kunci lain</p>
              </div>
            </div>
          </CommandEmpty>

          {GROUP_ORDER.map((groupKey, gi) => {
            const cmds = commands.filter(c => c.group === groupKey);
            if (cmds.length === 0) return null;
            return (
              <div key={groupKey}>
                {gi > 0 && <CommandSeparator className="my-1.5 mx-3" />}
                <CommandGroup heading={
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2">
                    {GROUP_LABEL[groupKey]}
                  </span>
                }>
                  {cmds.map(cmd => <PaletteItem key={cmd.id} cmd={cmd} />)}
                </CommandGroup>
              </div>
            );
          })}
        </CommandList>

        {/* Footer */}
        <div className="shrink-0 border-t px-4 py-2 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            {([
              { keys: ['↑','↓'], label: 'navigasi' },
              { keys: ['↵'],     label: 'pilih'    },
              { keys: ['Esc'],   label: 'tutup'    },
            ] as { keys: string[]; label: string }[]).map(({ keys, label }) => (
              <span key={label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                {keys.map(k => (
                  <kbd key={k} className="h-4 min-w-[1rem] px-1 rounded text-[9px] font-mono bg-background border border-border inline-flex items-center justify-center">
                    {k}
                  </kbd>
                ))}
                <span className="opacity-50">{label}</span>
              </span>
            ))}
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/30">⌘K</span>
        </div>

      </Command>
    </CommandDialog>
  );
}