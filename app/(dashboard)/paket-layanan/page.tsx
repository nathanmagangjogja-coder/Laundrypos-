'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/shared/Modal';
import { Plus, Pencil, Trash2, PackageOpen } from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/utils';

const SETTINGS_KEY = 'service_packages';

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
}

const EMPTY = { name: '', description: '', price: '' };

export default function PaketLayananPage() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServicePackage | null>(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    fetch(`/api/settings?key=${SETTINGS_KEY}`)
      .then((r) => r.json())
      .then((body) => setPackages(body.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function persist(next: ServicePackage[]) {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: SETTINGS_KEY, value: next }),
      });
      if (!res.ok) throw new Error();
      setPackages(next);
      return true;
    } catch {
      toast.error('Gagal menyimpan paket layanan.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(pkg: ServicePackage) {
    setEditing(pkg);
    setForm({ name: pkg.name, description: pkg.description, price: String(pkg.price) });
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.price) {
      toast.error('Nama dan harga paket wajib diisi.');
      return;
    }
    const payload: ServicePackage = {
      id: editing?.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
    };
    const next = editing
      ? packages.map((p) => (p.id === editing.id ? payload : p))
      : [...packages, payload];

    const ok = await persist(next);
    if (ok) {
      setModalOpen(false);
      toast.success(editing ? 'Paket diperbarui.' : 'Paket ditambahkan.');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus paket layanan ini?')) return;
    const ok = await persist(packages.filter((p) => p.id !== id));
    if (ok) toast.success('Paket dihapus.');
  }

  return (
    <>
      <PageHeader
        title="Paket Layanan"
        description="Bundel layanan dengan harga khusus untuk ditawarkan ke customer."
        action={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Tambah Paket</Button>}
      />

      {loading ? (
        <div className="text-sm text-muted-foreground text-center py-12">Memuat...</div>
      ) : packages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <PackageOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Belum ada paket layanan.</p>
            <Button variant="outline" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Buat Paket Pertama</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="relative group">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{pkg.name}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(pkg)} className="h-7 w-7 grid place-items-center rounded-lg hover:bg-muted">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(pkg.id)} className="h-7 w-7 grid place-items-center rounded-lg hover:bg-rose-500/10 hover:text-rose-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {pkg.description && <p className="text-sm text-muted-foreground">{pkg.description}</p>}
                <p className="text-lg font-bold text-primary">{formatRupiah(pkg.price)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Paket' : 'Tambah Paket'}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nama Paket</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="mis. Paket Hemat 5kg" />
          </div>
          <div className="space-y-1.5">
            <Label>Deskripsi (opsional)</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Cuci + setrika, estimasi 2 hari" />
          </div>
          <div className="space-y-1.5">
            <Label>Harga (Rp)</Label>
            <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="50000" />
          </div>
          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {editing ? 'Simpan Perubahan' : 'Tambah Paket'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
