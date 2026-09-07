'use client';
import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Info, ListChecks, RotateCcw, Save, ScanLine, Shirt } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface InvoiceSettings {
  brandName: string;
  tagline: string;
  logoDataUrl: string | null;
  showLogo: boolean;
  showBranchLogo: boolean;
  showQr: boolean;
  terms: string;
  footer: string;
  labelPenerima: string;
  labelPengambilan: string;
  watermarkLunas: boolean;
}

const DEFAULT_SETTINGS: InvoiceSettings = {
  brandName: 'LaundryPOS',
  tagline: 'Laundry Kiloan & Satuan',
  logoDataUrl: null,
  showLogo: true,
  showBranchLogo: true,
  showQr: true,
  terms: 'Komplain maksimal 1x24 jam setelah cucian diterima. Kerusakan/kehilangan diganti maksimal 10x biaya laundry item terkait.',
  footer: 'Terima kasih telah menggunakan layanan LaundryPOS.',
  labelPenerima: 'Kasir Penerima',
  labelPengambilan: 'Kasir Pengambilan',
  watermarkLunas: true,
};

const STORAGE_KEY = 'laundrypos.custom-invoice-settings';

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded accent-primary border-input cursor-pointer"
      />
      {label}
    </label>
  );
}

export default function CustomInvoicePage() {
  const [settings, setSettings] = useState<InvoiceSettings>(DEFAULT_SETTINGS);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  function set<K extends keyof InvoiceSettings>(key: K, value: InvoiceSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => set('logoDataUrl', reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleReset() {
    setSettings(DEFAULT_SETTINGS);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.info('Pengaturan dikembalikan ke default.');
  }

  function handleSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast.success('Pengaturan invoice berhasil disimpan.');
    } catch {
      toast.error('Gagal menyimpan pengaturan.');
    }
  }

  const invoiceNo = `INV${new Date().toISOString().slice(0, 10).replace(/-/g, '')}0001`;

  return (
    <>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Custom Invoice" description="Logo, nama brand, warna, footer, dan konten bawah invoice." />
        <Button variant="outline" size="sm" onClick={handleReset} className="mt-1">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        {/* Settings form */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Info className="h-4 w-4" /> Identitas Invoice
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nama Brand</Label>
                  <Input value={settings.brandName} onChange={(e) => set('brandName', e.target.value)} placeholder="LaundryPOS" />
                </div>
                <div className="space-y-1.5">
                  <Label>Tagline</Label>
                  <Input value={settings.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="Laundry Kiloan & Satuan" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Logo Invoice</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    Browse...
                  </Button>
                  <span className="text-sm text-muted-foreground truncate">{fileName ?? 'No file selected.'}</span>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
                <Checkbox checked={settings.showLogo} onChange={(v) => set('showLogo', v)} label="Tampilkan logo" />
                <Checkbox checked={settings.showBranchLogo} onChange={(v) => set('showBranchLogo', v)} label="Logo outlet" />
                <Checkbox checked={settings.showQr} onChange={(v) => set('showQr', v)} label="Tampilkan QR" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <ListChecks className="h-4 w-4" /> Footer & Label
              </div>

              <div className="space-y-1.5">
                <Label>Syarat & Ketentuan</Label>
                <Textarea value={settings.terms} onChange={(e) => set('terms', e.target.value)} rows={3} />
              </div>

              <div className="space-y-1.5">
                <Label>Footer</Label>
                <Textarea value={settings.footer} onChange={(e) => set('footer', e.target.value)} rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Label penerima</Label>
                  <Input value={settings.labelPenerima} onChange={(e) => set('labelPenerima', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Label pengambilan</Label>
                  <Input value={settings.labelPengambilan} onChange={(e) => set('labelPengambilan', e.target.value)} />
                </div>
              </div>

              <Checkbox checked={settings.watermarkLunas} onChange={(v) => set('watermarkLunas', v)} label="Watermark lunas di PDF" />
            </CardContent>
          </Card>

          <Button onClick={handleSave} className="w-full sm:w-auto">
            <Save className="h-4 w-4" /> Simpan Pengaturan
          </Button>
        </div>

        {/* Live preview */}
        <Card className="h-fit lg:sticky lg:top-4">
          <CardContent className="pt-6">
            <div className="bg-white text-slate-900 rounded-lg text-sm p-6 relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  {settings.showLogo && (
                    settings.logoDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={settings.logoDataUrl} alt="Logo" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500 grid place-items-center text-white shrink-0 shadow">
                        <Shirt className="h-5 w-5" />
                      </div>
                    )
                  )}
                  <div>
                    <div className="font-bold text-base leading-tight">{settings.brandName || 'LaundryPOS'}</div>
                    <div className="text-[11px] text-slate-500 uppercase tracking-wide">{settings.tagline || 'System'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-primary font-bold tracking-wide">INVOICE</div>
                  <div className="text-[11px] text-slate-500 font-medium">{invoiceNo}</div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                <div className="text-xs text-slate-500">
                  {settings.showBranchLogo && <div className="font-medium text-slate-700">Outlet Utama</div>}
                  <div>Jl. Contoh No. 12</div>
                  <div>Telp: 0274-000000</div>
                </div>
                {settings.watermarkLunas && (
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                    Lunas
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
                <div>
                  <div className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">Customer</div>
                  <div className="font-semibold text-slate-800">Budi Santoso</div>
                  <div className="text-slate-500">0812-0000-0000</div>
                </div>
                <div>
                  <div className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">Tanggal</div>
                  <div className="font-semibold text-slate-800">{formatDate(new Date())}</div>
                </div>
                <div>
                  <div className="text-slate-400 uppercase tracking-wide text-[10px] mb-0.5">Total</div>
                  <div className="font-bold text-primary">Rp 45.000</div>
                </div>
              </div>

              {settings.terms && (
                <div className="mb-3 rounded-lg bg-slate-50 border border-slate-100 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-primary mb-1">Syarat & Ketentuan</div>
                  <div className="text-[11px] text-slate-500 leading-relaxed">{settings.terms}</div>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                <div>
                  <div>{settings.labelPenerima}: —</div>
                  <div>{settings.labelPengambilan}: —</div>
                </div>
                {settings.showQr && (
                  <div className="h-12 w-12 rounded-md border border-slate-200 grid place-items-center text-slate-300 shrink-0">
                    <ScanLine className="h-6 w-6" />
                  </div>
                )}
              </div>

              {settings.footer && (
                <div className="text-center text-[11px] text-slate-400 mt-4">{settings.footer}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
