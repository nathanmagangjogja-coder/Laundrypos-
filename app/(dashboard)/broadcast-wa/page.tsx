'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { sendWhatsApp } from '@/lib/whatsapp';
import type { WaSettings } from '@/lib/store';
import type { Customer } from '@/types';
import { api } from '@/lib/api';

export default function BroadcastWaPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [waSettings, setWaSettings] = useState<WaSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    Promise.all([
      api.listCustomers(),
      fetch('/api/settings?key=wa_settings').then((r) => r.json()).then((b) => b.data),
    ])
      .then(([custs, wa]) => {
        setCustomers(Array.isArray(custs) ? custs : []);
        setWaSettings(wa);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone ?? '').includes(search)
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((c) => c.id)));
  }

  async function handleSend() {
    if (!message.trim()) return toast.error('Pesan tidak boleh kosong.');
    if (selected.size === 0) return toast.error('Pilih minimal satu customer.');

    const targets = customers.filter((c) => selected.has(c.id) && c.phone);
    setSending(true);
    setProgress({ done: 0, total: targets.length });

    for (const c of targets) {
      try {
        const personalized = message.replaceAll('{nama}', c.name);
        await sendWhatsApp(waSettings ?? ({} as WaSettings), c.phone!, personalized);
      } catch {
        // lanjut ke penerima berikutnya meski satu gagal
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
      await new Promise((r) => setTimeout(r, 400)); // jeda kecil, hindari rate-limit gateway
    }

    setSending(false);
    toast.success(`Broadcast selesai — ${targets.length} pesan diproses.`);
  }

  return (
    <>
      <PageHeader title="Broadcast WhatsApp" description="Kirim pesan WhatsApp ke banyak customer sekaligus. Gunakan {nama} untuk personalisasi." />

      {!waSettings?.url && !loading && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-4 text-sm text-amber-800 dark:text-amber-300">
            Gateway WhatsApp belum dikonfigurasi di <b>Pengaturan → WhatsApp Gateway</b>. Pesan akan dibuka satu-satu lewat wa.me sebagai fallback (tetap bisa dipakai, tapi tidak otomatis).
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" /> Pilih Customer ({selected.size} dipilih)
              </span>
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {selected.size === filtered.length ? 'Batal semua' : 'Pilih semua'}
              </Button>
            </div>
            <Input placeholder="Cari nama/nomor..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="max-h-96 overflow-y-auto space-y-1 border rounded-xl p-2">
              {loading ? (
                <div className="text-sm text-muted-foreground text-center py-8">Memuat customer...</div>
              ) : filtered.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">Tidak ada customer ditemukan.</div>
              ) : (
                filtered.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={selected.has(c.id)}
                      onChange={() => toggle(c.id)}
                      disabled={!c.phone}
                    />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.phone || 'tanpa no. HP'}</span>
                  </label>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <span className="text-sm font-semibold flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> Pesan
            </span>
            <Textarea
              rows={8}
              placeholder="Halo {nama}, ada promo cuci hemat minggu ini..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {sending && (
              <div className="text-xs text-muted-foreground">
                Mengirim {progress.done}/{progress.total}...
              </div>
            )}
            <Button onClick={handleSend} disabled={sending} className="w-full">
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {sending ? 'Mengirim...' : `Kirim ke ${selected.size} customer`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
