'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/shared/Modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Phone, Eye, Users, Search, MapPin, User } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Customer } from '@/types';
import { api } from '@/lib/api';

const EMPTY: Omit<Customer, 'id' | 'created_at'> = { name: '', phone: '', address: '' };

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CustomerSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 rounded bg-muted" />
            <div className="h-3 w-28 rounded bg-muted" />
          </div>
          <div className="h-3 w-32 rounded bg-muted hidden md:block" />
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-lg bg-muted" />
            <div className="h-8 w-8 rounded-lg bg-muted" />
            <div className="h-8 w-8 rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd, isSearch }: { onAdd: () => void; isSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
      <div className="relative mb-6">
        <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 flex items-center justify-center animate-float shadow-lg">
          {isSearch ? <Search className="h-12 w-12 text-emerald-400" /> : <Users className="h-12 w-12 text-emerald-400" />}
        </div>
        {!isSearch && (
          <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
            <Plus className="h-3.5 w-3.5 text-primary" />
          </div>
        )}
      </div>
      <h3 className="text-lg font-bold mb-2">
        {isSearch ? 'Tidak Ditemukan' : 'Belum Ada Customer'}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
        {isSearch
          ? 'Coba kata kunci lain atau hapus filter pencarian.'
          : 'Tambahkan pelanggan pertama Anda untuk mulai mencatat transaksi laundry.'}
      </p>
      {!isSearch && (
        <Button onClick={onAdd} className="rounded-xl shadow-lg shadow-primary/25 hover:scale-105 transition-all duration-300">
          <Plus className="mr-2 h-4 w-4" /> Tambah Customer Pertama
        </Button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [form, setForm] = useState<Omit<Customer, 'id' | 'created_at'>>(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      setCustomers(await api.listCustomers());
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal memuat customer');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const filtered = safeCustomers.filter(c => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    const nameMatch = c?.name?.toLowerCase().includes(s) ?? false;
    // Cocokkan nomor telepon di posisi manapun (termasuk digit belakang), abaikan karakter non-digit pada query
    const digitsOnly = s.replace(/\D/g, '');
    const phoneMatch = digitsOnly ? (c?.phone?.includes(digitsOnly) ?? false) : (c?.phone?.toLowerCase().includes(s) ?? false);
    return nameMatch || phoneMatch;
  });

  function openAdd() { setEditTarget(null); setForm(EMPTY); setOpen(true); }
  function openEdit(c: Customer) {
    setEditTarget(c);
    setForm({ name: c.name, phone: c.phone, address: c.address ?? '' });
    setOpen(true);
  }

  function isDuplicate(name: string, phone: string) {
    const n = name.trim().toLowerCase();
    const p = phone.trim();
    return safeCustomers.some(
      (c) => c.id !== editTarget?.id && c.phone === p && c.name.trim().toLowerCase() === n
    );
  }

  async function handleSave() {
    const name = form.name.trim();
    const phone = form.phone.replace(/\D/g, '');
    if (!name || !phone) { toast.error('Nama dan No. HP wajib diisi'); return; }
    if (isDuplicate(name, phone)) {
      toast.error('Customer dengan nama dan nomor HP yang sama sudah terdaftar.');
      return;
    }
    try {
      const payload = { ...form, name, phone };
      if (editTarget) {
        await api.updateCustomer(editTarget.id, payload);
        toast.success('✅ Customer berhasil diperbarui');
      } else {
        await api.createCustomer(payload);
        toast.success('🎉 Customer berhasil ditambahkan');
      }
      await refresh();
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal menyimpan customer');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.deleteCustomer(deleteTarget.id);
      await refresh();
      toast.success('🗑️ Customer berhasil dihapus');
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal menghapus customer');
    }
  }

  return (
    <>
      {/* Hero Header */}
      <div className={cn(
        'relative overflow-hidden rounded-2xl p-6 mb-6',
        'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent',
        'border border-emerald-500/15 animate-fade-in',
      )}>
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-400/30 shrink-0">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Customer</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{safeCustomers.length}</span> pelanggan terdaftar
                </p>
              </div>
            </div>
          </div>
          <Button onClick={openAdd} className="rounded-xl shadow-lg shadow-primary/25 hover:scale-105 transition-all duration-300">
            <Plus className="mr-2 h-4 w-4" /> Tambah Customer
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <CardContent className="p-4 md:p-6 space-y-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau nomor HP (bisa digit belakang)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>

          {loading ? (
            <CustomerSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState onAdd={openAdd} isSearch={search.length > 0} />
          ) : (
            <div className="space-y-0 rounded-xl border overflow-hidden">
              {/* Header */}
              <div className="hidden md:grid grid-cols-[2fr_1.5fr_2fr_100px] gap-4 px-4 py-3 bg-muted/40 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Nama</span>
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> No. HP</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Alamat</span>
                <span>Aksi</span>
              </div>

              {filtered.map((c, idx) => (
                <div
                  key={c.id}
                  className={cn(
                    'grid grid-cols-1 md:grid-cols-[2fr_1.5fr_2fr_100px] gap-2 md:gap-4 px-4 py-3.5',
                    'border-b last:border-0 transition-colors duration-150',
                    'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10',
                    'animate-fade-in',
                  )}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Avatar + Nama */}
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {c.name.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="font-semibold text-sm">{c.name}</span>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center">
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-primary hover:underline text-sm">
                      <Phone className="h-3.5 w-3.5 shrink-0" />{c.phone}
                    </a>
                  </div>

                  {/* Alamat */}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="truncate">{c.address || '—'}</span>
                  </div>

                  {/* Aksi */}
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30" asChild>
                      <Link href={`/customers/${c.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteTarget(c)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Tambah/Edit */}
      <Modal open={open} onOpenChange={setOpen} title={editTarget ? 'Edit Customer' : 'Tambah Customer'}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nama *</Label>
            <Input placeholder="Nama lengkap" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">No. HP / WhatsApp *</Label>
            <Input
              placeholder="08xxxxxxxx"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alamat</Label>
            <Input placeholder="Alamat lengkap" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="rounded-xl" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Batal</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md shadow-primary/25">{editTarget ? 'Perbarui' : 'Simpan'}</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Hapus */}
      <Modal open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Hapus Customer?">
        <div className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
          <Trash2 className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Customer <strong className="text-foreground">{deleteTarget?.name}</strong> akan dihapus secara permanen.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-xl">Batal</Button>
          <Button variant="destructive" onClick={handleDelete} className="rounded-xl">
            <Trash2 className="mr-2 h-4 w-4" /> Hapus
          </Button>
        </div>
      </Modal>
    </>
  );
}