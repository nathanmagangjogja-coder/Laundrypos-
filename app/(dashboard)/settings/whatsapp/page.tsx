'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CheckCircle, Loader2 } from 'lucide-react';

export interface WaSettings {
  url: string;
  token: string;
  tplNew: string;
  tplReady: string;
}

export default function WhatsappSettings() {
  const [settings, setSettings] = useState<WaSettings>({ url: '', token: '', tplNew: '', tplReady: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/settings?key=wa_settings');
        if (res.ok) {
          const body = await res.json();
          if (body.data) setSettings(body.data);
        }
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'wa_settings', value: settings }),
      });
      if (res.ok) {
        toast.success('Pengaturan WA disimpan');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error('Gagal menyimpan pengaturan');
      }
    } catch {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-12 text-center text-muted-foreground">Memuat pengaturan...</div>;

  return (
    <>
      <PageHeader title="WhatsApp Gateway" description="Integrasi Fonnte / Wablas / WA Business API." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Kredensial</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>API URL</Label>
              <Input value={settings.url} onChange={e => setSettings(s => ({ ...s, url: e.target.value }))} placeholder="https://api.fonnte.com/send" />
            </div>
            <div className="space-y-2">
              <Label>API Token</Label>
              <Input type="password" value={settings.token} onChange={e => setSettings(s => ({ ...s, token: e.target.value }))} placeholder="Token rahasia..." />
            </div>
            <Button onClick={handleSave} className="flex items-center gap-2" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : null}
              {saved ? 'Tersimpan!' : 'Simpan'}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Template Pesan</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Nota Baru</Label>
              <Textarea rows={4} value={settings.tplNew} onChange={e => setSettings(s => ({ ...s, tplNew: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Variabel: {'{{name}}'}, {'{{invoice}}'}, {'{{total}}'}, {'{{est}}'}</p>
            </div>
            <div className="space-y-2">
              <Label>Laundry Selesai</Label>
              <Textarea rows={3} value={settings.tplReady} onChange={e => setSettings(s => ({ ...s, tplReady: e.target.value }))} />
            </div>
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan Template
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
