'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Receipt, Users, Plus,
  Settings, QrCode, Gift, Handshake,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

const items: { href: string; label: string; icon: any; roles: Role[]; primary?: boolean }[] = [
  { href: '/dashboard',        label: 'Home',     icon: LayoutDashboard, roles: ['super_admin', 'admin', 'mitra'] },
  { href: '/transactions',     label: 'Trx',      icon: Receipt,         roles: ['super_admin', 'admin', 'mitra'] },
  { href: '/transactions/new', label: 'Tambah',   icon: Plus,            roles: ['super_admin', 'admin', 'mitra'], primary: true },
  { href: '/mitra/commission', label: 'Komisi',   icon: Handshake,       roles: ['mitra'] },
  { href: '/scan',             label: 'Scan',     icon: QrCode,          roles: ['super_admin', 'admin', 'mitra'] },
  { href: '/loyalty',          label: 'Loyalty',  icon: Gift,            roles: ['super_admin', 'admin'] },
  { href: '/customers',        label: 'Customer', icon: Users,           roles: ['super_admin', 'admin', 'mitra'] },
  { href: '/settings',         label: 'Setting',  icon: Settings,        roles: ['super_admin', 'admin'] },
];

export function MobileNav({ role, loading = false }: { role?: Role; loading?: boolean }) {
  const pathname = usePathname();

  if (loading) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur-md">
        <div className="flex h-16">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-center gap-1">
              <div className="h-5 w-5 animate-pulse rounded bg-muted" />
              <div className="h-2 w-8 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </nav>
    );
  }

  const filtered = items.filter(i => !role || i.roles.includes(role));

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50 md:hidden',
      'border-t bg-background/95 backdrop-blur-md',
      'shadow-[0_-4px_20px_rgba(0,0,0,0.08)]',
    )}>
      {/* Garis aksen di atas nav */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary/40 via-sky-400/40 to-emerald-400/40" />

      <div className="flex h-16">
        {filtered.map((item) => {
          const active = pathname === item.href ||
            (item.href !== '/dashboard' && item.href !== '/transactions/new' && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center justify-center gap-1 relative"
              >
                <div className={cn(
                  'h-12 w-12 rounded-full flex items-center justify-center -mt-5',
                  'bg-gradient-to-br from-primary to-primary/80',
                  'shadow-lg shadow-primary/40',
                  'transition-all duration-200 active:scale-95',
                  'ring-4 ring-background',
                )}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-primary mt-0.5">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium',
                'transition-all duration-200 relative',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                item.href === '/loyalty' && !active ? 'text-emerald-600 dark:text-emerald-400' : '',
              )}
            >
              {/* Active indicator dot di atas */}
              {active && (
                <span className="absolute top-1.5 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full bg-primary animate-scale-in" />
              )}

              {/* Icon container */}
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200',
                active
                  ? 'bg-primary/10 scale-110'
                  : 'hover:bg-muted',
              )}>
                <Icon className="h-5 w-5" />
              </div>

              <span className={cn(active && 'font-semibold')}>{item.label}</span>

              {/* Loyalty badge */}
              {item.href === '/loyalty' && !active && (
                <span className="absolute top-2 right-[20%] h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}