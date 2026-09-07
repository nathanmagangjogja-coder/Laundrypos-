'use client';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Trash2, Plus, Receipt, UserPlus, Loader2,
  Shirt, CreditCard, CheckCircle2, UserCircle, Sparkles,
  Clock, MapPin, Phone, History, Tag,
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { VoucherInput } from '@/components/vouchers/VoucherInput';
import { Stepper, StepFooter } from '@/components/shared/Stepper';
import { Badge } from '@/components/ui/badge';
import { ConfirmModal } from '@/components/shared/Modal';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { LoyaltyBadge } from '@/components/loyalty/LoyaltyBadge';
import { StatusBadge, PaymentBadge } from '@/components/transactions/StatusBadge';
import type { Customer, Outlet, Service, Voucher, Transaction } from '@/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

type Item = { id: string; service_id: string; qty: number };

const STEPS = [
  { id: 'customer', title: 'Customer & Outlet', description: 'Pilih penerima laundry', icon: <UserCircle className="h-4 w-4" /> },
  { id: 'items',    title: 'Item & Layanan',   description: 'Tambah cucian',       icon: <Shirt className="h-4 w-4" /> },
  { id: 'payment',  title: 'Pembayaran',       description: 'Tagihan & voucher',   icon: <CreditCard className="h-4 w-4" /> },
  { id: 'confirm',  title: 'Konfirmasi',       description: 'Review & simpan',     icon: <CheckCircle2 className="h-4 w-4" /> },
];

export function TransactionForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
  const [customPaid, setCustomPaid] = useState<number>(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [outletId, setOutletId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'lunas' | 'belum_lunas' | 'dp'>('lunas');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [custs, outs, svcs, txs] = await Promise.all([
          api.listCustomers(),
          api.listOutlets(),
          api.listServices(),
          api.listTransactions().catch(() => [] as Transaction[]),
        ]);
        setCustomers(custs);
        setOutlets(outs);
        setServices(svcs.filter(s => s.active));
        setTransactions(txs);
      } catch (e: any) {
        toast.error(e?.message ?? 'Gagal memuat data (pakai mode offline)');
      } finally {
        setLoadingOptions(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (customers.length && !customerId) setCustomerId(customers[0].id);
    if (outlets.length && !outletId) setOutletId(outlets[0].id);
    if (services.length && items.length === 0) {
      setItems([{ id: '1', service_id: services[0].id, qty: 1 }]);
    }
  }, [customers, outlets, services]);

  useEffect(() => { setAppliedVoucher(null); }, [customerId]);

  const total = useMemo(() => items.reduce((s, it) => {
    const svc = services.find(x => x.id === it.service_id);
    return s + (svc ? svc.price * it.qty : 0);
  }, 0), [items, services]);
  const discount = appliedVoucher ? Math.min(total, appliedVoucher.discount_amount) : 0;
  const finalTotal = Math.max(0, total - discount);

  useEffect(() => {
    if (paymentStatus === 'dp') setCustomPaid(Math.round(finalTotal / 2));
    else if (paymentStatus === 'lunas') setCustomPaid(finalTotal);
    else setCustomPaid(0);
  }, [paymentStatus, finalTotal]);

  const currentCustomer = customers.find(c => c.id === customerId) ?? null;
  const currentOutlet = outlets.find(o => o.id === outletId) ?? null;
  const customerHistory = useMemo(
    () => transactions.filter(t => t.customer_id === customerId).slice(0, 5),
    [transactions, customerId]
  );
  const estimatedFinish = useMemo(() => {
    if (!items.length) return null;
    const maxEst = Math.max(...items.map(it => services.find(s => s.id === it.service_id)?.est_hours ?? 24));
    return new Date(Date.now() + maxEst * 3600 * 1000);
  }, [items, services]);

  const canStep1 = !!customerId && !!outletId;
  const canStep2 = items.length > 0 && items.every(i => i.qty >= 0.1);
  const canStep3 = finalTotal >= 0 && (paymentStatus !== 'dp' || (customPaid >= 0 && customPaid <= finalTotal));

  function goNext() {
    if (step === 0 && !canStep1) {
      toast.error('Pilih customer dan outlet terlebih dahulu');
      return;
    }
    if (step === 1 && !canStep2) {
      toast.error('Tambahkan minimal 1 item dengan qty ≥ 0.1');
      return;
    }
    if (step === 2 && !canStep3) {
      toast.error('Periksa kembali pembayaran');
      return;
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }
  function goPrev() { setStep(s => Math.max(s - 1, 0)); }

  async function handleCreateCustomer() {
    if (!newCustomer.name || !newCustomer.phone) { toast.error('Nama dan HP wajib'); return; }
    setSubmitLoading(true);
    try {
      const saved = await api.createCustomer(newCustomer);
      setCustomers(p => [saved, ...p]);
      setCustomerId(saved.id);
      setIsAddingCustomer(false);
      setNewCustomer({ name: '', phone: '', address: '' });
      toast.success('Customer ditambahkan');
    } catch (error: any) { toast.error(error?.message ?? 'Gagal menambah customer'); }
    finally { setSubmitLoading(false); }
  }

  function addItem() {
    if (!services.length) return;
    setItems(p => [...p, { id: String(Date.now()), service_id: services[0].id, qty: 1 }]);
  }
  function removeItem(id: string) { setItems(p => p.filter(x => x.id !== id)); }

  async function submit() {
    setSubmitLoading(true);
    try {
      const customer = customers.find(c => c.id === customerId)!;
      const outlet = outlets.find(o => o.id === outletId)!;
      const paid = paymentStatus === 'lunas' ? finalTotal : paymentStatus === 'dp' ? customPaid : 0;

      const details = items.map((it, idx) => {
        const svc = services.find(s => s.id === it.service_id)!;
        return {
          id: `td${Date.now()}${idx}`,
          service_id: svc.id,
          service_name: svc.name,
          qty: it.qty,
          unit: svc.unit,
          price: svc.price,
          subtotal: svc.price * it.qty,
        };
      });

      const saved = await api.createTransaction({
        invoice_no: '',
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        outlet_id: outlet.id,
        outlet_name: outlet.name,
        mitra_id: null,
        mitra_name: null,
        mitra_commission_pct: services[0] ? 10 : 0,
        details,
        total: finalTotal,
        paid,
        payment_status: paymentStatus,
        status: 'diterima',
        notes,
        est_done_at: estimatedFinish?.toISOString() ?? new Date().toISOString(),
        voucher_code: appliedVoucher?.code,
      });
      toast.success(`Transaksi ${saved.invoice_no} berhasil dibuat`);
      setConfirmOpen(false);
      setTimeout(() => router.push('/transactions'), 700);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan');
    } finally {
      setSubmitLoading(false);
    }
  }

  if (loadingOptions) {
    return (
      <div className="grid gap-4 animate-pulse">
        <div className="h-20 rounded-2xl bg-muted/50" />
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="h-72 rounded-2xl bg-muted/50 lg:col-span-2" />
          <div className="h-72 rounded-2xl bg-muted/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-none bg-gradient-to-br from-indigo-500/5 via-primary/5 to-purple-500/5 shadow-lg shadow-primary/10 backdrop-blur">
        <CardContent className="pt-6">
          <Stepper steps={STEPS} current={step} onStepClick={(i) => i < step && setStep(i)} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2 min-h-[420px]">
          {/* ==================== STEP 1: CUSTOMER ==================== */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in-up">
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/20 text-sky-600">
                      <UserCircle className="h-4 w-4" />
                    </span>
                    Customer & Outlet
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2 pt-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Customer <span className="text-destructive">*</span></Label>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setIsAddingCustomer(true)}>
                        <Plus className="mr-1 h-3 w-3" /> Tambah Customer Baru
                      </Button>
                    </div>
                    <Select value={customerId} onValueChange={setCustomerId}>
                      <SelectTrigger><SelectValue placeholder="Pilih customer..." /></SelectTrigger>
                      <SelectContent>
                        {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} — {c.phone}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Outlet <span className="text-destructive">*</span></Label>
                    <Select value={outletId} onValueChange={setOutletId}>
                      <SelectTrigger><SelectValue placeholder="Pilih outlet..." /></SelectTrigger>
                      <SelectContent>
                        {outlets.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {currentCustomer && (
                    <div className="md:col-span-2 space-y-4 border-t border-dashed pt-4 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <Label className="mb-0 text-xs font-bold uppercase tracking-widest text-slate-500">Detail Customer</Label>
                        <Badge variant="luxe" className="gap-1">
                          <Sparkles className="h-3 w-3" /> Pelanggan Tetap
                        </Badge>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                          <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-500/10 text-sky-600">
                            <Phone className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Kontak</div>
                            <div className="text-sm font-semibold truncate">{currentCustomer.phone}</div>
                          </div>
                        </div>
                        {currentCustomer.address && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
                              <MapPin className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Alamat</div>
                              <div className="text-sm font-semibold truncate">{currentCustomer.address}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <LoyaltyBadge customerId={customerId} />
                      </div>

                      {customerHistory.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            <History className="h-3 w-3" /> Riwayat Transaksi Terakhir
                          </div>
                          <div className="space-y-1.5">
                            {customerHistory.map(tx => (
                              <div key={tx.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border bg-white/50 hover:bg-white transition-colors">
                                <div className="min-w-0">
                                  <div className="text-xs font-bold font-mono truncate">{tx.invoice_no}</div>
                                  <div className="text-[10px] text-muted-foreground truncate">
                                    {format(new Date(tx.created_at), 'dd MMM yyyy · HH:mm', { locale: id })}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs font-semibold">{formatRupiah(tx.total)}</span>
                                  <StatusBadge status={tx.status} className="scale-90" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== STEP 2: ITEMS ==================== */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in-up">
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/20 text-amber-600">
                      <Shirt className="h-4 w-4" />
                    </span>
                    Daftar Item Laundry
                  </CardTitle>
                  <Button onClick={addItem} size="sm" variant="outline" className="h-9">
                    <Plus className="mr-1 h-4 w-4" /> Tambah Item
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3 pt-5">
                  {items.map(it => {
                    const svc = services.find(x => x.id === it.service_id);
                    return (
                      <div key={it.id} className="grid grid-cols-12 items-end gap-2 rounded-xl border p-3 bg-card hover:shadow-md hover:shadow-slate-200/50 transition-all">
                        <div className="col-span-12 md:col-span-6 space-y-1">
                          <Label className="text-xs">Layanan</Label>
                          <Select value={it.service_id} onValueChange={v => setItems(p => p.map(x => x.id === it.id ? { ...x, service_id: v } : x))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name} — {formatRupiah(s.price)}/{s.unit}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-5 md:col-span-2 space-y-1">
                          <Label className="text-xs">Qty ({svc?.unit})</Label>
                          <Input type="number" min="0.1" step="0.1" value={it.qty}
                            onChange={e => setItems(p => p.map(x => x.id === it.id ? { ...x, qty: parseFloat(e.target.value) || 0 } : x))} />
                        </div>
                        <div className="col-span-5 md:col-span-3 space-y-0.5 text-right">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Estimasi</div>
                          <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                            <Clock className="h-3 w-3" /> {svc?.est_hours ?? 24} jam
                          </div>
                          <div className="text-base font-black text-primary">{formatRupiah((svc?.price ?? 0) * it.qty)}</div>
                        </div>
                        <Button variant="ghost" size="icon" className="col-span-2 md:col-span-1 text-destructive hover:bg-destructive/10" onClick={() => removeItem(it.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="py-8 text-center rounded-xl border-2 border-dashed border-muted-foreground/20">
                      <Shirt className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" strokeWidth={1.5} />
                      <p className="text-sm font-medium text-muted-foreground">Belum ada item</p>
                      <p className="text-xs text-muted-foreground/70">Klik tombol &quot;Tambah Item&quot; di atas</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-t-4 border-t-amber-500/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Estimasi Waktu Penyelesaian
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {estimatedFinish ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500/20 text-amber-600">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-amber-700 font-bold">Selesai sekitar</div>
                        <div className="text-lg font-black tracking-tight">
                          {format(estimatedFinish, 'EEEE, dd MMMM yyyy · HH:mm', { locale: id })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Tambahkan item untuk melihat estimasi</div>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" /> Catatan Khusus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Contoh: warna terang pisah, jangan disetrika, pewangi lavender, dll..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="min-h-[90px] resize-y"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== STEP 3: PAYMENT ==================== */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in-up">
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-600">
                      <CreditCard className="h-4 w-4" />
                    </span>
                    Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-5">
                  <div className="space-y-2">
                    <Label>Status Pembayaran <span className="text-destructive">*</span></Label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { v: 'lunas',       label: 'Lunas',       color: 'from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40' },
                        { v: 'dp',          label: 'DP',          color: 'from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40' },
                        { v: 'belum_lunas', label: 'Belum Lunas', color: 'from-rose-500/20 to-pink-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40' },
                      ] as const).map(opt => (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => setPaymentStatus(opt.v)}
                          className={cn(
                            'p-3 rounded-xl border-2 transition-all font-bold text-xs uppercase tracking-wider',
                            paymentStatus === opt.v
                              ? `bg-gradient-to-br ${opt.color} shadow-md scale-[1.02]`
                              : 'bg-card hover:bg-muted/50 border-border'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentStatus === 'dp' && (
                    <div className="space-y-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-fade-in">
                      <Label className="text-amber-700 dark:text-amber-300">Jumlah Bayar (DP)</Label>
                      <Input
                        type="number"
                        value={customPaid}
                        onChange={e => setCustomPaid(Number(e.target.value))}
                        max={finalTotal}
                        className="font-mono text-base"
                      />
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Total tagihan</span>
                        <span className="font-bold">{formatRupiah(finalTotal)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Sisa yang harus dibayar</span>
                        <span className="font-bold text-rose-600">{formatRupiah(Math.max(0, finalTotal - customPaid))}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 border-t pt-4">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Voucher & Diskon</Label>
                    <VoucherInput
                      customerId={customerId}
                      applied={appliedVoucher}
                      onApply={setAppliedVoucher}
                      onRemove={() => setAppliedVoucher(null)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== STEP 4: CONFIRM ==================== */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in-up">
              <Card className="overflow-hidden border-t-4 border-t-emerald-500">
                <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    Review & Konfirmasi Transaksi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20">
                      <div className="text-[10px] uppercase tracking-widest text-sky-700 font-bold mb-2 flex items-center gap-1">
                        <UserCircle className="h-3 w-3" /> Customer
                      </div>
                      <div className="font-bold">{currentCustomer?.name ?? '-'}</div>
                      <div className="text-xs text-muted-foreground">{currentCustomer?.phone}</div>
                      {currentCustomer?.address && (
                        <div className="text-xs text-muted-foreground mt-1">{currentCustomer.address}</div>
                      )}
                    </div>
                    <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                      <div className="text-[10px] uppercase tracking-widest text-indigo-700 font-bold mb-2 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Outlet
                      </div>
                      <div className="font-bold">{currentOutlet?.name ?? '-'}</div>
                      <div className="text-xs text-muted-foreground">{currentOutlet?.address}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Item ({items.length})</div>
                    <div className="space-y-1.5">
                      {items.map((it, i) => {
                        const svc = services.find(s => s.id === it.service_id);
                        return (
                          <div key={it.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-xs font-black">{i + 1}</span>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold truncate">{svc?.name}</div>
                                <div className="text-[10px] text-muted-foreground">{it.qty} × {svc?.unit} @ {formatRupiah(svc?.price ?? 0)}</div>
                              </div>
                            </div>
                            <div className="font-bold shrink-0">{formatRupiah((svc?.price ?? 0) * it.qty)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {estimatedFinish && (
                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-semibold">Estimasi Selesai</span>
                      </div>
                      <span className="text-sm font-black">
                        {format(estimatedFinish, 'dd MMM yyyy · HH:mm', { locale: id })}
                      </span>
                    </div>
                  )}

                  {notes && (
                    <div className="p-3 rounded-xl bg-muted/40 border border-dashed">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Catatan</div>
                      <div className="text-sm leading-relaxed">{notes}</div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <PaymentBadge status={paymentStatus} />
                    <StatusBadge status="diterima" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* ============== SIDEBAR RINGKASAN (ALL STEPS) ============== */}
        <div className="space-y-4 lg:sticky lg:top-6 self-start">
          <Card className="overflow-hidden shadow-xl shadow-primary/10 border-primary/10">
            <CardHeader className="bg-gradient-to-br from-indigo-600 via-primary to-purple-600 text-white">
              <CardTitle className="flex items-center gap-2 text-white">
                <Receipt className="h-4 w-4" />
                Ringkasan Tagihan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Subtotal ({items.length} item)</span>
                <span className="font-mono font-semibold">{formatRupiah(total)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  Diskon Voucher
                  {appliedVoucher && <Badge variant="soft-success" className="text-[9px] h-4 px-1.5 py-0">{appliedVoucher.code}</Badge>}
                </span>
                <span className="font-mono font-semibold text-emerald-600">- {formatRupiah(discount)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Total</span>
                <span className="text-2xl font-black tracking-tight bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {formatRupiah(finalTotal)}
                </span>
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Status Bayar</span>
                  <PaymentBadge status={paymentStatus} className="scale-90" />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Jumlah Dibayar</span>
                  <span className="font-bold font-mono">{formatRupiah(customPaid)}</span>
                </div>
                {paymentStatus !== 'lunas' && (
                  <div className="flex justify-between text-xs p-2 rounded-lg bg-rose-500/10 border border-rose-500/15">
                    <span className="text-rose-600 font-semibold">Sisa</span>
                    <span className="font-black font-mono text-rose-600">{formatRupiah(Math.max(0, finalTotal - customPaid))}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {step !== 3 && (
            <Card className="border-dashed">
              <CardContent className="pt-5 space-y-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Progress</div>
                <div className="space-y-2">
                  {STEPS.map((s, i) => (
                    <div
                      key={s.id}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg text-xs transition-all',
                        i === step && 'bg-primary/10 border border-primary/30 text-primary font-bold',
                        i < step && 'text-emerald-600 font-semibold',
                        i > step && 'text-muted-foreground/60'
                      )}
                    >
                      <span className={cn(
                        'grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-black',
                        i < step ? 'bg-emerald-500 text-white' :
                        i === step ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                      )}>
                        {i < step ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                      </span>
                      {s.title}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <StepFooter
        current={step}
        total={STEPS.length}
        onPrev={goPrev}
        onNext={goNext}
        onSubmit={() => setConfirmOpen(true)}
        submitLabel={step === STEPS.length - 1 ? 'Buat Transaksi' : undefined}
        nextLabel={step === 1 && !estimatedFinish ? 'Selesaikan Item' : undefined}
        canNext={step === 0 ? canStep1 : step === 1 ? canStep2 : step === 2 ? canStep3 : true}
        isSubmitting={submitLoading && step === STEPS.length - 1}
        submitIcon={step === STEPS.length - 1 ? <Receipt className="h-4 w-4" /> : undefined}
      />

      {/* ─── Modal: Tambah Customer ─── */}
      <div className="hidden">
        {/* Hidden wrapper to not break existing Modal import used inside form below */}
      </div>
      <div
        className={cn(
          'fixed inset-0 z-50 items-center justify-center p-4',
          isAddingCustomer ? 'flex animate-fade-in' : 'hidden'
        )}
        onClick={() => setIsAddingCustomer(false)}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl animate-fade-in-up border"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/15 text-sky-600 ring-4 ring-sky-500/10">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-tight">Tambah Customer Baru</h3>
              <p className="text-xs text-muted-foreground">Isi data customer di bawah ini</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Nama Lengkap <span className="text-destructive">*</span></Label>
              <Input value={newCustomer.name} onChange={e => setNewCustomer(p => ({ ...p, name: e.target.value }))} placeholder="Contoh: Andi Pratama" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">No. WhatsApp <span className="text-destructive">*</span></Label>
              <Input value={newCustomer.phone} onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))} placeholder="0812xxxxxxxx" inputMode="numeric" pattern="[0-9]*" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Alamat</Label>
              <Input value={newCustomer.address} onChange={e => setNewCustomer(p => ({ ...p, address: e.target.value }))} placeholder="Alamat lengkap (opsional)" />
            </div>
          </div>
          <div className="flex gap-2 pt-5">
            <Button variant="outline" className="flex-1" onClick={() => setIsAddingCustomer(false)}>Batal</Button>
            <Button className="flex-1 bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-500/30" onClick={handleCreateCustomer} disabled={submitLoading}>
              {submitLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Simpan Customer
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Modal: Konfirmasi Submit ─── */}
      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="success"
        title="Simpan Transaksi?"
        description={`Total ${formatRupiah(finalTotal)} — Customer ${currentCustomer?.name}. Setelah disimpan, invoice akan dibuat dan customer akan mendapat notifikasi.`}
        confirmText="Ya, Buat Transaksi"
        onConfirm={submit}
        loading={submitLoading}
      />
    </div>
  );
}
