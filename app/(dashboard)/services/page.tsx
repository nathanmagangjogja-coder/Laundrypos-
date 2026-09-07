'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/shared/Modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Wrench, Clock, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah, cn } from '@/lib/utils';
import type { Service } from '@/types';
import { api } from '@/lib/api';

const EMPTY = { name: '', unit: 'kg' as 'kg' | 'pcs', price: 0, est_hours: 24, active: true };

function ServiceSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
          <div className="h-5 w-20 rounded-full bg-muted" />
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-lg bg-muted" />
            <div className="h-8 w-8 rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
      <div className="relative mb-6">
        <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-violet-100 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/20 flex items-center justify-center animate-float shadow-lg">
          <Wrench className="h-12 w-12 text-violet-400" />
        </div>
        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
          <Plus className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>
      <h3 className="text-lg font-bold mb-2">Belum Ada Layanan</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
        Tambahkan layanan dan harga untuk mulai menerima transaksi laundry.
      </p>
      <Button onClick={onAdd} className="rounded-xl shadow-lg shadow-primary/25 hover:scale-105 transition-all duration-300">
        <Plus className="mr-2 h-4 w-4" /> Tambah Layanan Pertama
      </Button>
    </div>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [form, setForm] = useState<Omit<Service, 'id'>>(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try { setServices(await api.listServices()); }
    catch (error: any) { toast.error(error.message ?? 'Gagal memuat layanan'); }
    finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  function openAdd() { setEditTarget(null); setForm(EMPTY); setOpen(true); }
  function openEdit(s: Service) {
    setEditTarget(s);
    setForm({ name: s.name, unit: s.unit, price: s.price, est_hours: s.est_hours, active: s.active });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Nama layanan wajib diisi'); return; }
    try {
      if (editTarget) { await api.updateService(editTarget.id, form); toast.success('✅ Layanan diperbarui'); }
      else { await api.createService(form); toast.success('🎉 Layanan ditambahkan'); }
      await refresh(); setOpen(false);
    } catch (error: any) { toast.error(error.message ?? 'Gagal menyimpan layanan'); }
  }

  async function toggleActive(s: Service) {
    try {
      await api.updateService(s.id, { active: !s.active });
      await refresh();
      toast.success(s.active ? 'Layanan dinonaktifkan' : 'Layanan diaktifkan');
    } catch (error: any) { toast.error(error.message ?? 'Gagal mengubah status'); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.deleteService(deleteTarget.id);
      await refresh();
      toast.success('🗑️ Layanan dihapus');
      setDeleteTarget(null);
    } catch (error: any) { toast.error(error.message ?? 'Gagal menghapus'); }
  }

  const safeServices = Array.isArray(services) ? services : [];
  const activeCount = safeServices.filter(s => s.active).length;

  return (
    <>
      {/* Hero Header */}
      <div className={cn(
        'relative overflow-hidden rounded-2xl p-6 mb-6',
        'bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent',
        'border border-violet-500/15 animate-fade-in',
      )}>
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-violet-400/10 blur-2xl pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-400/30 shrink-0">
              <Wrench className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Layanan & Harga</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">{activeCount}</span> aktif dari{' '}
                <span className="font-semibold text-foreground">{safeServices.length}</span> layanan
              </p>
            </div>
          </div>
          <Button onClick={openAdd} className="rounded-xl shadow-lg shadow-primary/25 hover:scale-105 transition-all duration-300">
            <Plus className="mr-2 h-4 w-4" /> Tambah Layanan
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <CardContent className="p-4 md:p-6">
          {loading ? <ServiceSkeleton /> : safeServices.length === 0 ? <EmptyState onAdd={openAdd} /> : (
            <div className="space-y-0 rounded-xl border overflow-hidden">
              <div className="hidden md:grid grid-cols-[2fr_80px_1.5fr_1fr_100px_100px] gap-4 px-4 py-3 bg-muted/40 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5" /> Layanan</span>
                <span>Unit</span>
                <span className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Harga</span>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Estimasi</span>
                <span>Status</span>
                <span>Aksi</span>
              </div>

              {safeServices.map((s, idx) => (
                <div
                  key={s.id}
                  className={cn(
                    'grid grid-cols-1 md:grid-cols-[2fr_80px_1.5fr_1fr_100px_100px] gap-2 md:gap-4 px-4 py-4',
                    'border-b last:border-0 transition-colors duration-150',
                    'hover:bg-violet-50/50 dark:hover:bg-violet-950/10',
                    !s.active && 'opacity-60',
                    'animate-fade-in',
                  )}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-100 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/20 flex items-center justify-center border border-violet-200/50 dark:border-violet-800/30 shrink-0">
                      <Wrench className="h-4 w-4 text-violet-500" />
                    </div>
                    <span className="font-semibold text-sm">{s.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs font-bold uppercase bg-muted px-2 py-1 rounded-lg">{s.unit}</span>
                  </div>
                  <div className="flex items-center font-bold text-sm text-primary">{formatRupiah(s.price)}</div>
                  <div className="flex items-center text-sm text-muted-foreground">{s.est_hours} jam</div>
                  <div className="flex items-center">
                    <button onClick={() => toggleActive(s)} className="flex items-center gap-1.5 transition-all hover:scale-105">
                      {s.active
                        ? <ToggleRight className="h-6 w-6 text-emerald-500" />
                        : <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                      }
                      <span className={cn('text-xs font-semibold', s.active ? 'text-emerald-600' : 'text-muted-foreground')}>
                        {s.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteTarget(s)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={open} onOpenChange={setOpen} title={editTarget ? 'Edit Layanan' : 'Tambah Layanan'}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nama Layanan *</Label>
            <Input placeholder="Cuci Kering..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unit</Label>
              <Select value={form.unit} onValueChange={(v: 'kg' | 'pcs') => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="pcs">pcs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Harga (Rp)</Label>
              <Input type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estimasi (jam)</Label>
            <Input type="number" min={1} value={form.est_hours} onChange={e => setForm(f => ({ ...f, est_hours: Number(e.target.value) }))} className="rounded-xl" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Batal</Button>
            <Button onClick={handleSave} className="rounded-xl shadow-md shadow-primary/25">{editTarget ? 'Perbarui' : 'Simpan'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Hapus Layanan?">
        <div className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
          <Trash2 className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Layanan <strong className="text-foreground">{deleteTarget?.name}</strong> akan dihapus permanen.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-xl">Batal</Button>
          <Button variant="destructive" onClick={handleDelete} className="rounded-xl"><Trash2 className="mr-2 h-4 w-4" /> Hapus</Button>
        </div>
      </Modal>
    </>
  );
}