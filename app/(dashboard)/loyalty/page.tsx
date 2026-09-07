'use client';
/**
 * app/(dashboard)/loyalty/page.tsx
 * Full Loyalty & Voucher Management Dashboard.
 */
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoyaltyStatsCard } from '@/components/loyalty/LoyaltyStatsCard';
import { VoucherCard } from '@/components/loyalty/VoucherCard';
import { LoyaltyBadge } from '@/components/loyalty/LoyaltyBadge';
import {
  Gift, Tag, Star, TrendingUp, Users, CheckCircle2, Clock, AlertCircle,
  Plus, Search, Crown, Wallet, BarChart3, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLoyalty } from '@/hooks/useLoyalty';
import { getLoyaltyAnalytics } from '@/lib/loyalty-store';
import { api } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import type { Customer } from '@/types';
import { toast } from 'sonner';

export default function LoyaltyPage() {
  const { vouchers, activeVouchers, allPoints, analytics, refresh } = useLoyalty();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'used' | 'expired'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    api.listCustomers().then(setCustomers).catch(() => toast.error('Gagal memuat data pelanggan'));
  }, []);

  // Filter vouchers
  const now = new Date().toISOString();
  const safeVouchers = Array.isArray(vouchers) ? vouchers : [];
  const filtered = safeVouchers.filter(v => {
    const matchSearch =
      !search ||
      (v?.code?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (v?.customer_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !v.is_used && v.expired_at >= now) ||
      (statusFilter === 'used' && v.is_used) ||
      (statusFilter === 'expired' && !v.is_used && v.expired_at < now);
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Loyalty & Voucher"
          description="Kelola program loyalitas, voucher diskon, dan poin reward pelanggan"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Buat Voucher
          </Button>
        </div>
      </div>

      {/* Stats */}
      {analytics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <LoyaltyStatsCard
            title="Voucher Aktif"
            value={analytics.activeVouchers}
            subtitle="Belum digunakan"
            icon={Tag}
            color="emerald"
          />
          <LoyaltyStatsCard
            title="Voucher Terpakai"
            value={analytics.usedVouchers}
            subtitle="Berhasil diredeem"
            icon={CheckCircle2}
            color="blue"
          />
          <LoyaltyStatsCard
            title="Total Diskon"
            value={formatRupiah(analytics.totalDiscountGiven)}
            subtitle="Sudah diberikan"
            icon={Wallet}
            color="amber"
          />
          <LoyaltyStatsCard
            title="Redemption Rate"
            value={`${analytics.redemptionRate}%`}
            subtitle="Dari total voucher"
            icon={BarChart3}
            color="violet"
          />
        </div>
      )}

      <Tabs defaultValue="vouchers">
        <TabsList>
          <TabsTrigger value="vouchers" className="flex items-center gap-2">
            <Tag className="h-4 w-4" /> Voucher
          </TabsTrigger>
          <TabsTrigger value="points" className="flex items-center gap-2">
            <Star className="h-4 w-4" /> Poin Pelanggan
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* ─── Vouchers Tab ───────────────────────────────────── */}
        <TabsContent value="vouchers" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kode atau nama customer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua ({vouchers.length})</SelectItem>
                <SelectItem value="active">Aktif ({analytics?.activeVouchers ?? 0})</SelectItem>
                <SelectItem value="used">Terpakai ({analytics?.usedVouchers ?? 0})</SelectItem>
                <SelectItem value="expired">Kadaluarsa ({analytics?.expiredVouchers ?? 0})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Tag className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="font-medium">Belum ada voucher</p>
              <p className="text-sm">Voucher akan otomatis terbuat setelah transaksi</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(v => (
                <VoucherCard key={v.id} voucher={v} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Points Tab ─────────────────────────────────────── */}
        <TabsContent value="points" className="space-y-4 mt-4">
          {allPoints.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Star className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="font-medium">Belum ada data poin</p>
              <p className="text-sm">Poin otomatis masuk setelah transaksi lunas</p>
            </div>
          ) : (
            <>
              {/* Reward tiers info */}
              <div className="rounded-xl border bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-amber-200 dark:border-amber-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="h-4 w-4 text-amber-600" />
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200 text-sm">Reward Milestones</h3>
                </div>
                <div className="grid gap-2 sm:grid-cols-3 text-sm">
                  <div className="flex items-center gap-2 bg-card rounded-lg p-2 border">
                    <span className="text-xl">🥉</span>
                    <div>
                      <div className="font-bold">10 Poin</div>
                      <div className="text-xs text-muted-foreground">Diskon Rp 5.000</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-card rounded-lg p-2 border">
                    <span className="text-xl">🥇</span>
                    <div>
                      <div className="font-bold">25 Poin</div>
                      <div className="text-xs text-muted-foreground">Gratis cuci 1kg</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-card rounded-lg p-2 border">
                    <span className="text-xl">💎</span>
                    <div>
                      <div className="font-bold">50 Poin</div>
                      <div className="text-xs text-muted-foreground">Diskon Rp 50.000</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Points ranking table */}
              <div className="rounded-xl border overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Loyalty Ranking ({allPoints.length} customer)
                  </h3>
                </div>
                <div className="divide-y">
                  {allPoints
                    .sort((a: any, b: any) => b.total_points - a.total_points)
                    .map((p: any, idx: number) => {
                      return (
                        <div key={p.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                          <div className="w-7 text-center font-bold text-muted-foreground text-sm">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{p.customer_name}</div>
                            <LoyaltyBadge points={p.total_points} className="mt-1" />
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 justify-end">
                              <Star className="h-3.5 w-3.5" />
                              {p.total_points}
                            </div>
                            <div className="text-xs text-muted-foreground">{p.lifetime_points} total</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* ─── Analytics Tab ──────────────────────────────────── */}
        <TabsContent value="analytics" className="space-y-4 mt-4">
          {analytics && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <Gift className="h-4 w-4 text-emerald-500" />
                    Program Overview
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total voucher dibuat</span>
                      <span className="font-semibold">{analytics.totalVouchers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Voucher aktif</span>
                      <span className="font-semibold text-emerald-600">{analytics.activeVouchers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Voucher terpakai</span>
                      <span className="font-semibold text-blue-600">{analytics.usedVouchers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kadaluarsa</span>
                      <span className="font-semibold text-red-500">{analytics.expiredVouchers}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-muted-foreground">Redemption rate</span>
                      <span className="font-bold text-violet-600">{analytics.redemptionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total diskon keluar</span>
                      <span className="font-bold">{formatRupiah(analytics.totalDiscountGiven)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total poin diberikan</span>
                      <span className="font-bold text-amber-600">{analytics.totalPointsAwarded} poin</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <Crown className="h-4 w-4 text-amber-500" />
                    Top Loyal Customers
                  </h3>
                  {analytics.topCustomers.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Belum ada data</p>
                  ) : (
                    <div className="space-y-2">
                      {analytics.topCustomers.map((c, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900 text-xs font-bold text-amber-700 dark:text-amber-300">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{c.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {c.vouchersUsed} voucher diredeem
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-amber-600 font-bold text-sm shrink-0">
                            <Star className="h-3.5 w-3.5" />
                            {c.points}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Voucher Dialog */}
      <CreateVoucherDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        customers={customers}
        onCreated={() => {
          refresh();
          toast.success('Voucher berhasil dibuat!');
          setShowCreateDialog(false);
        }}
      />
    </div>
  );
}

// ─── Create Voucher Dialog ─────────────────────────────────────────────────────
function CreateVoucherDialog({
  open,
  onClose,
  customers,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  onCreated: () => void;
}) {
  const [customerId, setCustomerId] = useState('');
  const [type, setType] = useState<'discount' | 'reward' | 'points'>('discount');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountAmount, setDiscountAmount] = useState('10000');
  const [minimumOrder, setMinimumOrder] = useState('30000');
  const [daysValid, setDaysValid] = useState('30');

  async function handleCreate() {
    if (!customerId) { toast.error('Pilih customer'); return; }
    if (!title) { toast.error('Isi judul voucher'); return; }
    const customer = customers.find(c => c.id === customerId)!;
    try {
      await api.createManualVoucher({
        customerId,
        customerName: customer.name,
        type,
        title,
        description,
        discountAmount: parseInt(discountAmount) || 0,
        minimumOrder: parseInt(minimumOrder) || 0,
        daysValid: parseInt(daysValid) || 30,
      });
      onCreated();
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal membuat voucher');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-emerald-500" />
            Buat Voucher Manual
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Pilih customer..." /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} — {c.phone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipe Voucher</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">Diskon</SelectItem>
                  <SelectItem value="reward">Reward</SelectItem>
                  <SelectItem value="points">Poin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Masa Berlaku (hari)</Label>
              <Input
                type="number"
                value={daysValid}
                onChange={e => setDaysValid(e.target.value)}
                placeholder="30"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Judul Voucher</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Contoh: Voucher Diskon Rp 10.000"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Deskripsi</Label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Contoh: Hadiah loyalitas untuk pelanggan setia"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nilai Diskon (Rp)</Label>
              <Input
                type="number"
                value={discountAmount}
                onChange={e => setDiscountAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Minimal Order (Rp)</Label>
              <Input
                type="number"
                value={minimumOrder}
                onChange={e => setMinimumOrder(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Batal</Button>
            <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> Buat Voucher
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
