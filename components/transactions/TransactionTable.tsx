'use client';
import { useState } from 'react';
import Link from 'next/link';
import { StatusBadge, PaymentBadge } from './StatusBadge';
import { formatDate, formatRupiah, cn } from '@/lib/utils';
import { Eye, CheckSquare, RefreshCw, Receipt, ArrowRight } from 'lucide-react';
import type { Transaction, LaundryStatus } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { LAUNDRY_STATUSES } from '@/constants';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

function EmptyState() {
  const { user } = useAuth();
  const canCreate = user?.role === 'super_admin' || user?.role === 'admin';
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
      <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center mb-4">
        <Receipt className="h-10 w-10 text-muted-foreground/40" />
      </div>
      <h3 className="text-base font-bold mb-1">Belum Ada Transaksi</h3>
      <p className="text-sm text-muted-foreground mb-4">Transaksi yang sesuai filter tidak ditemukan.</p>
      {canCreate && (
        <Button asChild size="sm" className="rounded-xl">
          <Link href="/transactions/new">+ Buat Transaksi Baru</Link>
        </Button>
      )}
    </div>
  );
}

export function TransactionTable({ data = [], onRefresh }: { data?: Transaction[]; onRefresh?: () => void }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();

  // ─── Role flags ────────────────────────────────────────────────────────────
  const isSuperAdmin  = user?.role === 'super_admin';
  const isAdmin       = user?.role === 'admin';
  const isMitra       = user?.role === 'mitra';

  const canBulkUpdate = isSuperAdmin || isAdmin;   // bulk status update
  const canSeeFinance = isSuperAdmin;               // kolom total & payment hanya super admin
  const canSeeTotal   = isSuperAdmin || isAdmin;    // admin bisa lihat total tapi tidak ubah payment

  if (!data || !data.length) return <EmptyState />;

  const toggleAll = () => setSelectedIds(
    selectedIds.length === data.length ? [] : data.map(t => t.id)
  );
  const toggleOne = (id: string) => setSelectedIds(prev =>
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  );

  const handleBulkUpdate = async (status: LaundryStatus) => {
    if (!selectedIds.length || !canBulkUpdate) return;
    setUpdating(true);
    try {
      await Promise.all(selectedIds.map(id => api.updateTransaction(id, { status })));
      toast.success(`✅ ${selectedIds.length} transaksi → ${LAUNDRY_STATUSES.find(s => s.value === status)?.label}`);
      setSelectedIds([]);
      onRefresh?.();
    } catch {
      toast.error('Gagal memperbarui transaksi');
    } finally {
      setUpdating(false);
    }
  };

  // Kolom grid berubah berdasarkan role
  // Super admin: semua kolom
  // Admin: tanpa kolom payment, tapi ada total
  // Mitra: tanpa kolom total & payment
  const gridCols = isSuperAdmin
    ? 'md:grid-cols-[40px_140px_1fr_1fr_110px_100px_120px_80px_60px]'
    : isAdmin
    ? 'md:grid-cols-[40px_140px_1fr_1fr_110px_120px_80px_60px]'
    : 'md:grid-cols-[140px_1fr_1fr_120px_80px_60px]'; // mitra

  return (
    <div className="space-y-3">

      {/* Bulk action bar — hanya admin & super admin */}
      {canBulkUpdate && selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary">{selectedIds.length} dipilih</span>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="rounded-lg" disabled={updating}>
                  {updating && <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Ubah Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Pilih Status Baru</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {LAUNDRY_STATUSES.map(s => (
                  <DropdownMenuItem key={s.value} onClick={() => handleBulkUpdate(s.value as LaundryStatus)}>
                    <div className={cn('h-2 w-2 rounded-full mr-2', s.color.split(' ')[0])} />
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => setSelectedIds([])}>Batal</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden bg-card">

        {/* Header */}
        <div className={cn(
          'hidden md:grid gap-3 px-4 py-3 bg-muted/40 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider',
          gridCols,
        )}>
          {canBulkUpdate && (
            <div className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-border"
                checked={selectedIds.length === data.length && data.length > 0}
                onChange={toggleAll}
              />
            </div>
          )}
          <span>Invoice</span>
          <span>Customer</span>
          <span>Outlet</span>
          {canSeeTotal   && <span>Total</span>}
          {canSeeFinance && <span>Bayar</span>}
          <span>Status</span>
          <span>Tanggal</span>
          <span></span>
        </div>

        {/* Rows */}
        {data.map((t, idx) => {
          const isSelected = selectedIds.includes(t.id);
          return (
            <div
              key={t.id}
              className={cn(
                'grid grid-cols-1 md:grid',
                gridCols,
                'gap-2 md:gap-3 px-4 py-3.5',
                'border-b last:border-0 transition-all duration-150',
                'hover:bg-muted/30',
                isSelected && 'bg-primary/5',
                'animate-fade-in',
              )}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              {/* Checkbox — hanya untuk bulk update */}
              {canBulkUpdate && (
                <div className="hidden md:flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={isSelected}
                    onChange={() => toggleOne(t.id)}
                  />
                </div>
              )}

              {/* Invoice */}
              <div className="flex items-center">
                <span className="font-mono text-xs font-semibold bg-muted/60 px-2 py-0.5 rounded-md">
                  {t.invoice_no}
                </span>
              </div>

              {/* Customer */}
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/80 to-indigo-600/80 flex items-center justify-center text-white text-[10px] font-bold shrink-0 hidden md:flex">
                  {t.customer_name?.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{t.customer_phone}</div>
                </div>
              </div>

              {/* Outlet */}
              <div className="hidden md:flex items-center text-sm text-muted-foreground truncate">
                {t.outlet_name}
              </div>

              {/* Total — admin & super admin */}
              {canSeeTotal && (
                <div className="flex items-center font-bold text-sm">
                  {formatRupiah(t.total)}
                </div>
              )}

              {/* Payment badge — hanya super admin */}
              {canSeeFinance && (
                <div className="flex items-center">
                  <PaymentBadge status={t.payment_status} />
                </div>
              )}

              {/* Status laundry — semua role lihat */}
              <div className="flex items-center">
                <StatusBadge status={t.status} />
              </div>

              {/* Date */}
              <div className="hidden md:flex items-center text-xs text-muted-foreground">
                {formatDate(t.created_at)}
              </div>

              {/* Action */}
              <div className="flex items-center">
                <Link
                  href={`/transactions/${t.id}`}
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all group"
                >
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>Menampilkan <strong>{data.length}</strong> transaksi</span>
        {selectedIds.length > 0 && (
          <span className="text-primary font-semibold">{selectedIds.length} dipilih</span>
        )}
      </div>
    </div>
  );
}