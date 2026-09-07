import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/server-auth';

// ─── Rentang tanggal berdasarkan periode ────────────────────────────────────
function periodRange(period: string): { from: string | null; to: string | null } {
  const now = new Date();
  if (period === 'today') {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  if (period === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  if (period === 'last_month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  return { from: null, to: null }; // 'all'
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    // Halaman ini ditujukan untuk super_admin (dan admin, dibatasi ke outlet-nya sendiri)
    if (!user || user.role === 'mitra') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') ?? 'all';
    const { from, to } = periodRange(period);

    const supabase = createSupabaseAdmin();

    // ── Transaksi (hanya kolom yang perlu untuk agregasi) ──────────────────
    let txQuery = supabase
      .from('transactions')
      .select('id, outlet_id, customer_id, created_by, processed_by, completed_by, created_at, customers(name)')
      .order('created_at', { ascending: false });

    if (from) txQuery = txQuery.gte('created_at', from);
    if (to) txQuery = txQuery.lt('created_at', to);
    if (user.role === 'admin' && user.outlet_id) txQuery = txQuery.eq('outlet_id', user.outlet_id);

    const { data: txRows, error: txError } = await txQuery;
    if (txError) throw txError;

    // ── Master data pendukung ───────────────────────────────────────────────
    const [{ data: profiles, error: profileError }, { data: outlets, error: outletError }, { data: mitraRows, error: mitraError }, { data: commissionRows, error: commissionError }] =
      await Promise.all([
        supabase.from('profiles').select('id, full_name, role'),
        supabase.from('outlets').select('id, name, mitra_id'),
        supabase.from('mitra').select('id, name'),
        supabase.from('commissions').select('mitra_id, amount, status'),
      ]);
    if (profileError) throw profileError;
    if (outletError) throw outletError;
    if (mitraError) throw mitraError;
    if (commissionError) throw commissionError;

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name || 'Tanpa Nama']));
    const mitraMap = new Map((mitraRows ?? []).map((m: any) => [m.id, m.name]));

    // Ringkasan komisi per mitra_id
    const commissionByMitra = new Map<string, { total: number; pending: number; paid: number }>();
    for (const c of commissionRows ?? []) {
      if (!c.mitra_id) continue;
      const entry = commissionByMitra.get(c.mitra_id) ?? { total: 0, pending: 0, paid: 0 };
      const amount = Number(c.amount ?? 0);
      entry.total += amount;
      if (c.status === 'paid') entry.paid += amount;
      else entry.pending += amount;
      commissionByMitra.set(c.mitra_id, entry);
    }

    const scopedOutlets = user.role === 'admin' && user.outlet_id
      ? (outlets ?? []).filter((o: any) => o.id === user.outlet_id)
      : (outlets ?? []);

    // ── Agregasi per outlet → per staff ─────────────────────────────────────
    type StaffAgg = {
      profile_id: string;
      full_name: string;
      received: number;
      processed: number;
      completed: number;
      customerIds: Set<string>;
      customerNames: Set<string>;
    };

    const result = scopedOutlets.map((outlet: any) => {
      const outletTx = (txRows ?? []).filter((t: any) => t.outlet_id === outlet.id);
      const staffMap = new Map<string, StaffAgg>();

      function touch(profileId: string | null | undefined, role: 'received' | 'processed' | 'completed', customerId: string | null, customerName: string) {
        if (!profileId) return;
        let agg = staffMap.get(profileId);
        if (!agg) {
          agg = {
            profile_id: profileId,
            full_name: profileMap.get(profileId) ?? 'Tidak Diketahui',
            received: 0, processed: 0, completed: 0,
            customerIds: new Set(), customerNames: new Set(),
          };
          staffMap.set(profileId, agg);
        }
        agg[role] += 1;
        if (customerId) agg.customerIds.add(customerId);
        if (customerName) agg.customerNames.add(customerName);
      }

      for (const t of outletTx) {
        const customerName = (Array.isArray(t.customers) ? t.customers[0]?.name : (t.customers as any)?.name) ?? 'Pelanggan';
        touch(t.created_by, 'received', t.customer_id, customerName);
        touch(t.processed_by, 'processed', t.customer_id, customerName);
        touch(t.completed_by, 'completed', t.customer_id, customerName);
      }

      const staff = Array.from(staffMap.values())
        .map((s) => ({
          profile_id: s.profile_id,
          full_name: s.full_name,
          received_count: s.received,
          processed_count: s.processed,
          completed_count: s.completed,
          total_activity: s.received + s.processed + s.completed,
          unique_customers: s.customerIds.size,
          customer_names: Array.from(s.customerNames).sort(),
        }))
        .sort((a, b) => b.total_activity - a.total_activity);

      const commission = outlet.mitra_id ? commissionByMitra.get(outlet.mitra_id) ?? { total: 0, pending: 0, paid: 0 } : null;

      return {
        outlet_id: outlet.id,
        outlet_name: outlet.name,
        mitra_id: outlet.mitra_id ?? null,
        mitra_name: outlet.mitra_id ? (mitraMap.get(outlet.mitra_id) ?? null) : null,
        commission_summary: commission,
        transaction_count: outletTx.length,
        staff,
      };
    })
    .filter((o: any) => o.transaction_count > 0 || o.staff.length > 0)
    .sort((a: any, b: any) => b.transaction_count - a.transaction_count);

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('[GET /api/dashboard/staff-performance]', error);
    return NextResponse.json({ error: error.message ?? 'Failed to load staff performance' }, { status: 500 });
  }
}
