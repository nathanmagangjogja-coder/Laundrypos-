'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/shared/Modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Store, MapPin, Phone, Calendar, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Outlet } from '@/types';
import { api } from '@/lib/api';

const EMPTY = { name: '', address: '', phone: '' };

// ─── Skeleton ────────────────────────────────────────────────────────────────
function OutletSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl border bg-card animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-3 w-56 rounded bg-muted" />
          </div>
          <div className="h-3 w-24 rounded bg-muted hidden md:block" />
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-lg bg-muted" />
            <div className="h-8 w-8 rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
      <div className="relative mb-6">
        <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/20 flex items-center justify-center animate-float shadow-lg">
          <Store className="h-12 w-12 text-orange-400" />
        </div>
        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
          <Plus className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">Belum Ada Outlet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
        Tambahkan outlet pertama Anda untuk mulai mengelola laundry di berbagai lokasi.
      </p>
      <Button
        onClick={onAdd}
        className="rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
      >
        <Plus className="mr-2 h-4 w-4" />
        Tambah Outlet Pertama
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Outlet | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState<Outlet | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      setOutlets(await api.listOutlets());
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal memuat outlet');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  function openAdd() { setEditTarget(null); setForm(EMPTY); setOpen(true); }
  function openEdit(o: Outlet) {
    setEditTarget(o);
    setForm({ name: o.name, address: o.address, phone: o.phone });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Nama outlet wajib diisi'); return; }
    try {
      if (editTarget) {
        await api.updateOutlet(editTarget.id, form);
        toast.success('✅ Outlet berhasil diperbarui');
      } else {
        await api.createOutlet(form);
        toast.success('🎉 Outlet berhasil ditambahkan');
      }
      await refresh();
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal menyimpan outlet');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.deleteOutlet(deleteTarget.id);
      await refresh();
      toast.success('🗑️ Outlet berhasil dihapus');
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal menghapus outlet');
    }
  }

  const safeOutlets = Array.isArray(outlets) ? outlets : [];

  return (
    <>
      {/* ── Page Hero Header ── */}
      <div className={cn(
        'relative overflow-hidden rounded-2xl p-6 mb-6',
        'bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent',
        'border border-orange-500/15',
        'animate-fade-in',
      )}>
        {/* Blob dekorasi */}
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-orange-400/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-4 left-16 h-20 w-20 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-400/30 shrink-0">
              <Store className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Outlet</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{safeOutlets.length}</span> outlet aktif
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={openAdd}
            className="rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Outlet
          </Button>
        </div>
      </div>

      {/* ── Content Card ── */}
      <Card className="border-0 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <CardContent className="p-4 md:p-6">
          {loading ? (
            <OutletSkeleton />
          ) : safeOutlets.length === 0 ? (
            <EmptyState onAdd={openAdd} />
          ) : (
            <div className="space-y-0 rounded-xl border overflow-hidden">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-[2fr_3fr_1.5fr_1.5fr_80px] gap-4 px-4 py-3 bg-muted/40 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Nama Outlet</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Alamat</span>
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Telepon</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Dibuat</span>
                <span>Aksi</span>
              </div>

              {/* Table Rows */}
              {safeOutlets.map((o, idx) => (
                <div
                  key={o.id}
                  className={cn(
                    'grid grid-cols-1 md:grid-cols-[2fr_3fr_1.5fr_1.5fr_80px] gap-2 md:gap-4 px-4 py-4',
                    'border-b last:border-0 transition-colors duration-150',
                    'hover:bg-orange-50/50 dark:hover:bg-orange-950/10',
                    'animate-fade-in',
                  )}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Nama */}
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/20 flex items-center justify-center shrink-0 border border-orange-200/50 dark:border-orange-800/30">
                      <Store className="h-4 w-4 text-orange-500" />
                    </div>
                    <span className="font-semibold text-sm">{o.name}</span>
                  </div>

                  {/* Alamat */}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground md:hidden">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{o.address || '-'}</span>
                  </div>
                  <span className="hidden md:flex items-center text-sm text-muted-foreground truncate">{o.address || '-'}</span>

                  {/* Telepon */}
                  <div className="flex items-center gap-1.5 text-sm md:hidden">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>{o.phone || '-'}</span>
                  </div>
                  <span className="hidden md:flex items-center text-sm">{o.phone || '-'}</span>

                  {/* Dibuat */}
                  <span className="hidden md:flex items-center text-xs text-muted-foreground">{formatDate(o.created_at)}</span>

                  {/* Aksi */}
                  <div className="flex items-center gap-1 md:justify-start justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                      onClick={() => openEdit(o)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
                      onClick={() => setDeleteTarget(o)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal Tambah/Edit ── */}
      <Modal open={open} onOpenChange={setOpen} title={editTarget ? 'Edit Outlet' : 'Tambah Outlet'}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nama Outlet *</Label>
            <Input
              placeholder="Contoh: LaundryPOS Cabang Malang"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alamat</Label>
            <Input
              placeholder="Jl. ..."
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Telepon</Label>
            <Input
              placeholder="021-..."
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Batal</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md shadow-primary/25">
              {editTarget ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal Hapus ── */}
      <Modal open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Hapus Outlet?">
        <div className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
          <Trash2 className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Outlet <strong className="text-foreground">{deleteTarget?.name}</strong> akan dihapus secara permanen dan tidak dapat dikembalikan.
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