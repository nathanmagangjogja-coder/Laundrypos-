'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Wallet, Banknote, CreditCard, QrCode as QrIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SETTINGS_KEY = 'payment_methods';

interface PaymentMethod {
  id: string;
  name: string;
  active: boolean;
}

const DEFAULT_METHODS: PaymentMethod[] = [
  { id: 'cash', name: 'Tunai', active: true },
  { id: 'transfer', name: 'Transfer Bank', active: true },
  { id: 'qris', name: 'QRIS', active: true },
  { id: 'debit', name: 'Kartu Debit', active: false },
];

const ICONS: Record<string, any> = { cash: Banknote, transfer: Wallet, qris: QrIcon, debit: CreditCard };

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newMethod, setNewMethod] = useState('');

  useEffect(() => {
    fetch(`/api/settings?key=${SETTINGS_KEY}`)
      .then((r) => r.json())
      .then((body) => setMethods(body.data ?? DEFAULT_METHODS))
      .catch(() => setMethods(DEFAULT_METHODS))
      .finally(() => setLoading(false));
  }, []);

  async function persist(next: PaymentMethod[]) {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: SETTINGS_KEY, value: next }),
      });
      if (!res.ok) throw new Error();
      setMethods(next);
    } catch {
      toast.error('Gagal menyimpan metode pembayaran.');
    } finally {
      setSaving(false);
    }
  }

  function handleAdd() {
    const name = newMethod.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (methods.some((m) => m.id === id)) {
      toast.error('Metode pembayaran sudah ada.');
      return;
    }
    persist([...methods, { id, name, active: true }]);
    setNewMethod('');
    toast.success('Metode pembayaran ditambahkan.');
  }

  function handleToggle(id: string) {
    persist(methods.map((m) => (m.id === id ? { ...m, active: !m.active } : m)));
  }

  function handleRemove(id: string) {
    persist(methods.filter((m) => m.id !== id));
    toast.success('Metode pembayaran dihapus.');
  }

  return (
    <>
      <PageHeader title="Metode Pembayaran" description="Atur metode pembayaran yang tersedia saat membuat transaksi." />
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder="Nama metode baru... (mis. GoPay)"
              value={newMethod}
              onChange={(e) => setNewMethod(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              disabled={saving}
            />
            <Button onClick={handleAdd} disabled={saving || !newMethod.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Tambah
            </Button>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-8">Memuat...</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {methods.map((m) => {
                const Icon = ICONS[m.id] ?? Wallet;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                      m.active ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30 opacity-60',
                    )}
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="flex-1 text-sm font-medium">{m.name}</span>
                    <button
                      onClick={() => handleToggle(m.id)}
                      disabled={saving}
                      className={cn(
                        'text-[11px] font-bold px-2 py-1 rounded-full transition-colors',
                        m.active ? 'bg-emerald-500/15 text-emerald-700' : 'bg-slate-500/15 text-slate-600',
                      )}
                    >
                      {m.active ? 'Aktif' : 'Nonaktif'}
                    </button>
                    <button
                      onClick={() => handleRemove(m.id)}
                      disabled={saving}
                      className="h-7 w-7 grid place-items-center rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                      aria-label={`Hapus ${m.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
