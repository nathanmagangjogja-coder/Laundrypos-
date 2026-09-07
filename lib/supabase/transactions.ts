// @version-check: v3-attachStaffNames-fix
import type { Transaction } from '@/types';

export const TRANSACTION_SELECT = `
  id,
  invoice_no,
  customer_id,
  outlet_id,
  mitra_id,
  total,
  paid,
  payment_status,
  status,
  notes,
  est_done_at,
  created_at,
  updated_at,
  created_by,
  processed_by,
  completed_by,
  customers (
    id,
    name,
    phone,
    address,
    created_at
  ),
  outlets (
    id,
    name,
    address,
    phone,
    created_at
  ),
  mitra (
    id,
    name,
    owner_name,
    phone,
    email,
    address,
    commission_pct,
    status,
    created_at
  ),
  transaction_details (
    id,
    service_id,
    qty,
    unit,
    price,
    subtotal,
    services (
      id,
      name,
      unit,
      price,
      est_hours,
      active
    )
  )
`;

export function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    invoice_no: row.invoice_no,
    customer_id: row.customer_id,
    customer_name: row.customers?.name ?? '',
    customer_phone: row.customers?.phone ?? '',
    outlet_id: row.outlet_id,
    outlet_name: row.outlets?.name ?? '',
    outlet_phone: row.outlets?.phone ?? '',
    mitra_id: row.mitra_id,
    mitra_name: row.mitra?.name ?? null,
    details: (row.transaction_details ?? []).map((detail: any) => ({
      id: detail.id,
      service_id: detail.service_id,
      service_name: detail.services?.name ?? '',
      qty: Number(detail.qty ?? 0),
      unit: detail.unit,
      price: Number(detail.price ?? 0),
      subtotal: Number(detail.subtotal ?? 0),
    })),
    total: Number(row.total ?? 0),
    paid: Number(row.paid ?? 0),
    payment_status: row.payment_status,
    status: row.status,
    notes: row.notes ?? '',
    est_done_at: row.est_done_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by ?? null,
    processed_by: row.processed_by ?? null,
    completed_by: row.completed_by ?? null,
  };
}

export function nextInvoiceNoFromCount(count: number): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  // Gunakan format: INV/YYYYMMDD/COUNT-RANDOM
  // Ini jauh lebih aman dari duplikat dibanding hanya COUNT
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV/${y}${m}${day}/${String(count + 1).padStart(4, '0')}-${random}`;
}

/**
 * Resolve created_by / processed_by / completed_by (uuid) jadi nama staf
 * (created_by_name / processed_by_name / completed_by_name) lewat tabel profiles.
 * Dipakai di halaman detail transaksi, invoice, dan tracking publik supaya
 * "Riwayat Pelayanan" (Diterima/Diproses/Diselesaikan oleh) selalu tampil nama,
 * bukan uuid mentah.
 */
export async function attachStaffNames(rows: any[], supabase: any): Promise<any[]> {
  const ids = new Set<string>();
  for (const r of rows) {
    if (r?.created_by) ids.add(r.created_by);
    if (r?.processed_by) ids.add(r.processed_by);
    if (r?.completed_by) ids.add(r.completed_by);
  }
  if (ids.size === 0) return rows;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', Array.from(ids));

  const nameMap = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]));

  return rows.map((r) => ({
    ...r,
    created_by_name: r?.created_by ? (nameMap.get(r.created_by) ?? null) : null,
    processed_by_name: r?.processed_by ? (nameMap.get(r.processed_by) ?? null) : null,
    completed_by_name: r?.completed_by ? (nameMap.get(r.completed_by) ?? null) : null,
  }));
}