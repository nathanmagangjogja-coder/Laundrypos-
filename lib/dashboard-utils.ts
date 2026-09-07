import type { Transaction, Customer, Outlet } from '@/types';

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
export function isToday(dateStr?: string | null) {
  if (!dateStr) return false;
  return isSameDay(new Date(dateStr), new Date());
}
export function isThisMonth(dateStr?: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}
export function isLastMonth(dateStr?: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return d.getFullYear() === lastMonth.getFullYear() && d.getMonth() === lastMonth.getMonth();
}
export function isOverdue(t: Transaction) {
  if (!t.est_done_at) return false;
  if (['selesai', 'diambil'].includes(t.status)) return false;
  return new Date(t.est_done_at).getTime() < Date.now();
}
export function isDueToday(t: Transaction) {
  if (!t.est_done_at) return false;
  if (['selesai', 'diambil'].includes(t.status)) return false;
  return isToday(t.est_done_at);
}
export function isOngoing(t: Transaction) {
  return !['selesai', 'diambil'].includes(t.status);
}

export function totalRevenue(txns: Transaction[]) {
  return txns.reduce((sum, t) => sum + (t.total || 0), 0);
}
export function totalReceivables(txns: Transaction[]) {
  return txns
    .filter((t) => t.payment_status !== 'lunas')
    .reduce((sum, t) => sum + Math.max((t.total || 0) - (t.paid || 0), 0), 0);
}

export interface ServiceRankRow {
  name: string;
  qty: number;
}
/** Ranking layanan paling laris — diambil dari details[] tiap transaksi. */
export function topServices(txns: Transaction[], limit = 5): ServiceRankRow[] {
  const map = new Map<string, number>();
  for (const t of txns) {
    for (const d of t.details ?? []) {
      const name = d.service_name || 'Lainnya';
      map.set(name, (map.get(name) ?? 0) + (Number(d.qty) || 0));
    }
  }
  return Array.from(map.entries())
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}

export interface OutletPerf {
  id: string;
  name: string;
  revenue: number;
  trxCount: number;
}
export function outletPerformance(txns: Transaction[], outlets: Outlet[]): OutletPerf[] {
  return outlets
    .map((o) => {
      const oTxns = txns.filter((t) => t.outlet_id === o.id);
      return { id: o.id, name: o.name, revenue: totalRevenue(oTxns), trxCount: oTxns.length };
    })
    .filter((o) => o.trxCount > 0)
    .sort((a, b) => b.revenue - a.revenue);
}

export interface ActiveCustomerRow {
  customer_id: string;
  customer_name: string;
  outlet_name: string;
  status: Transaction['status'];
  invoice_no: string;
  est_done_at: string;
}
/** Customer dengan transaksi yang masih berjalan (belum selesai/diambil). */
export function activeCustomers(txns: Transaction[], limit = 8): ActiveCustomerRow[] {
  return txns
    .filter(isOngoing)
    .slice(0, limit)
    .map((t) => ({
      customer_id: t.customer_id,
      customer_name: t.customer_name,
      outlet_name: t.outlet_name,
      status: t.status,
      invoice_no: t.invoice_no,
      est_done_at: t.est_done_at,
    }));
}

/** Grafik performa 7 hari terakhir — jumlah transaksi per hari. */
export function last7DaysCount(txns: Transaction[]) {
  const days: { label: string; count: number; isToday: boolean }[] = [];
  const labels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const count = txns.filter((t) => t.created_at && isSameDay(new Date(t.created_at), d)).length;
    days.push({ label: labels[d.getDay()], count, isToday: i === 0 });
  }
  return days;
}

export const STATUS_LABEL: Record<string, string> = {
  diterima: 'Diterima',
  dicuci: 'Dicuci',
  disetrika: 'Disetrika',
  selesai: 'Selesai',
  diambil: 'Diambil',
};
