import type { User, Outlet, Mitra, Customer, Service, Transaction, Commission } from '@/types';

export const dummyUsers: User[] = [
  { id: 'u1', name: 'Super Admin', email: 'superadmin@laundry.id', role: 'super_admin', created_at: '2024-01-01' },
  { id: 'u2', name: 'Admin Pusat', email: 'admin@laundry.id', role: 'admin', outlet_id: 'o1', created_at: '2024-01-02' },
  { id: 'u3', name: 'Mitra Sentosa', email: 'mitra@laundry.id', role: 'mitra', mitra_id: 'm1', created_at: '2024-01-03' },
];

export const dummyOutlets: Outlet[] = [
  { id: 'o1', name: 'LaundryPOS Pusat', address: 'Jl. Sudirman No. 1, Jakarta', phone: '021-555-0001', created_at: '2024-01-01' },
  { id: 'o2', name: 'LaundryPOS Bandung', address: 'Jl. Asia Afrika No. 99, Bandung', phone: '022-555-0002', created_at: '2024-01-02' },
  { id: 'o3', name: 'LaundryPOS Surabaya', address: 'Jl. Pemuda No. 7, Surabaya', phone: '031-555-0003', created_at: '2024-01-03' },
];

export const dummyMitra: Mitra[] = [
  { id: 'm1', name: 'Laundry Sentosa',  owner_name: 'Budi Santoso',  phone: '081234567001', email: 'sentosa@mitra.id',  address: 'Jl. Melati 10', commission_pct: 15, status: 'approved', created_at: '2024-01-04' },
  { id: 'm2', name: 'Laundry Bersih',   owner_name: 'Siti Aminah',   phone: '081234567002', email: 'bersih@mitra.id',   address: 'Jl. Mawar 22',  commission_pct: 12, status: 'approved', created_at: '2024-01-05' },
  { id: 'm3', name: 'Laundry Express',  owner_name: 'Joko Widodo',   phone: '081234567003', email: 'express@mitra.id',  address: 'Jl. Anggrek 5', commission_pct: 10, status: 'pending',  created_at: '2024-02-01' },
];

export const dummyCustomers: Customer[] = [
  { id: 'c1', name: 'Andi Pratama',   phone: '081298765001', address: 'Jl. Kenanga 1',  created_at: '2024-03-01' },
  { id: 'c2', name: 'Bella Safira',   phone: '081298765002', address: 'Jl. Dahlia 2',   created_at: '2024-03-02' },
  { id: 'c3', name: 'Citra Lestari',  phone: '081298765003', address: 'Jl. Flamboyan 3',created_at: '2024-03-03' },
  { id: 'c4', name: 'Dimas Pradana',  phone: '081298765004', address: 'Jl. Cempaka 4',  created_at: '2024-03-04' },
  { id: 'c5', name: 'Eka Putri',      phone: '081298765005', address: 'Jl. Tulip 5',    created_at: '2024-03-05' },
  { id: 'c6', name: 'Fajar Nugroho',  phone: '081298765006', address: 'Jl. Lily 6',     created_at: '2024-03-06' },
  { id: 'c7', name: 'Gita Maharani',  phone: '081298765007', address: 'Jl. Sakura 7',   created_at: '2024-03-07' },
  { id: 'c8', name: 'Hadi Wijaya',    phone: '081298765008', address: 'Jl. Teratai 8',  created_at: '2024-03-08' },
];

export const dummyServices: Service[] = [
  { id: 's1', name: 'Cuci Kering',         unit: 'kg',  price: 7000,  est_hours: 24, active: true },
  { id: 's2', name: 'Cuci Setrika',        unit: 'kg',  price: 9000,  est_hours: 48, active: true },
  { id: 's3', name: 'Setrika Saja',        unit: 'kg',  price: 5000,  est_hours: 24, active: true },
  { id: 's4', name: 'Express 6 Jam',       unit: 'kg',  price: 18000, est_hours: 6,  active: true },
  { id: 's5', name: 'Cuci Sepatu',         unit: 'pcs', price: 35000, est_hours: 48, active: true },
  { id: 's6', name: 'Cuci Tas',            unit: 'pcs', price: 40000, est_hours: 48, active: true },
  { id: 's7', name: 'Cuci Selimut',        unit: 'pcs', price: 25000, est_hours: 48, active: true },
];

function pad(n: number, len = 4) { return String(n).padStart(len, '0'); }
function inv(d: Date, n: number) {
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1, 2);
  return `INV/${y}${m}/${pad(n, 5)}`;
}

const now = new Date();
function dateOffset(days: number) { const d = new Date(now); d.setDate(d.getDate() + days); return d.toISOString(); }

export const dummyTransactions: Transaction[] = Array.from({ length: 24 }).map((_, i) => {
  const cust = dummyCustomers[i % dummyCustomers.length];
  const outlet = dummyOutlets[i % dummyOutlets.length];
  const mitra = i % 3 === 0 ? dummyMitra[i % dummyMitra.length] : null;
  const svc = dummyServices[i % dummyServices.length];
  const qty = svc.unit === 'kg' ? +(2 + (i % 5) * 1.5).toFixed(1) : (1 + (i % 3));
  const subtotal = svc.price * qty;
  const statusList: any[] = ['diterima', 'dicuci', 'disetrika', 'selesai', 'diambil'];
  const status = statusList[i % statusList.length];
  const payList: any[] = ['lunas', 'belum_lunas', 'dp', 'lunas'];
  const paymentStatus = payList[i % payList.length];
  const created = dateOffset(-i);
  return {
    id: `t${i + 1}`,
    invoice_no: inv(new Date(created), i + 1),
    customer_id: cust.id,
    customer_name: cust.name,
    customer_phone: cust.phone,
    outlet_id: outlet.id,
    outlet_name: outlet.name,
    mitra_id: mitra?.id ?? null,
    mitra_name: mitra?.name ?? null,
    details: [{
      id: `td${i + 1}`,
      service_id: svc.id,
      service_name: svc.name,
      qty, unit: svc.unit, price: svc.price, subtotal,
    }],
    total: subtotal,
    paid: paymentStatus === 'lunas' ? subtotal : paymentStatus === 'dp' ? subtotal / 2 : 0,
    payment_status: paymentStatus,
    status,
    notes: i % 4 === 0 ? 'Pakaian warna terang pisah' : '',
    est_done_at: dateOffset(-i + Math.ceil(svc.est_hours / 24)),
    created_at: created,
    updated_at: created,
  };
});

export const dummyCommissions: Commission[] = dummyTransactions
  .filter((t) => t.mitra_id)
  .map((t, i) => ({
    id: `cm${i + 1}`,
    mitra_id: t.mitra_id!,
    transaction_id: t.id,
    amount: Math.round(t.total * 0.15),
    status: i % 2 === 0 ? 'paid' : 'pending',
    created_at: t.created_at,
  }));
