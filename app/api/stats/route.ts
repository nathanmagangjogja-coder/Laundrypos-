import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/server-auth';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = user.role;
    const todayStart = startOfDay(new Date()).toISOString();
    const todayEnd = endOfDay(new Date()).toISOString();

    let stats: any = {};

    if (role === 'super_admin') {
      // ✅ semua mitra
      const { count: mitraCount } = await supabase.from('mitra').select('*', { count: 'exact', head: true });
      
      // ✅ semua komisi
      const { data: commissions } = await supabase.from('commissions').select('amount, status');
      const totalCommission = commissions?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0;
      const pendingCommission = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0;

      // ✅ revenue SaaS
      const { data: transactions } = await supabase.from('transactions').select('total');
      const totalRevenue = transactions?.reduce((sum, t) => sum + (Number(t.total) || 0), 0) || 0;

      // Ambil fee SaaS dari settings (default 5%)
      const { data: saasFeeSetting } = await supabase.from('settings').select('value').eq('key', 'saas_fee').maybeSingle();
      const saasFeePercent = Number(saasFeeSetting?.value ?? 5);

      // ✅ payout (total komisi yang sudah dibayar)
      const totalPaidCommission = commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0;

      stats = {
        mitraCount,
        totalRevenue,
        totalCommission,
        pendingCommission,
        totalPaidCommission,
        revenueSaaS: totalRevenue * (saasFeePercent / 100),
      };
    } else if (role === 'mitra') {
      if (!user.mitra_id) return NextResponse.json({ data: {} });

      // ✅ omzet sendiri
      const { data: transactions } = await supabase
        .from('transactions')
        .select('total, created_at, outlet_id')
        .eq('mitra_id', user.mitra_id);
      
      const totalOmzet = transactions?.reduce((sum, t) => sum + (Number(t.total) || 0), 0) || 0;

      // ✅ fee dipotong
      const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, status')
        .eq('mitra_id', user.mitra_id);
      
      const totalFee = commissions?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0;

      // ✅ net revenue
      const netRevenue = totalOmzet - totalFee;

      // ✅ performa outlet (hitung per outlet)
      const { data: outlets } = await supabase.from('outlets').select('id, name');
      const outletPerf = (outlets || []).map(o => {
        const oTrx = (transactions || []).filter((t: any) => t.outlet_id === o.id);
        const oRevenue = oTrx.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
        return {
          id: o.id,
          name: o.name,
          revenue: oRevenue,
          trxCount: oTrx.length
        };
      }).filter(o => o.trxCount > 0).sort((a, b) => b.revenue - a.revenue);

      stats = {
        totalOmzet,
        totalFee,
        netRevenue,
        outletCount: outletPerf.length,
        outletPerformance: outletPerf,
        pendingCommission: commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0,
      };
    } else if (role === 'admin') {
      const outletId = user.outlet_id;
      if (!outletId) return NextResponse.json({ data: {} });

      // ✅ transaksi
      const { data: transactions } = await supabase
        .from('transactions')
        .select('total, status, created_at')
        .eq('outlet_id', outletId);

      const totalTransactions = transactions?.length || 0;
      const todayTransactions = transactions?.filter(t => t.created_at >= todayStart && t.created_at <= todayEnd).length || 0;
      const todayRevenue = transactions?.filter(t => t.created_at >= todayStart && t.created_at <= todayEnd).reduce((sum, t) => sum + (Number(t.total) || 0), 0) || 0;

      // Ambil target dari settings (default 100)
      const { data: targetSetting } = await supabase.from('settings').select('value').eq('key', `target_${outletId}`).maybeSingle();
      const target = Number(targetSetting?.value ?? 100);

      // ✅ operasional outlet
      const ongoingOrders = transactions?.filter(t => !['selesai', 'diambil'].includes(t.status)).length || 0;

      stats = {
        totalTransactions,
        todayTransactions,
        todayRevenue,
        ongoingOrders,
        target,
      };
    }

    // Common stats: Revenue Chart Data (Last 14 Days)
    const fourteenDaysAgo = subDays(new Date(), 14).toISOString();
    let chartQuery = supabase
      .from('transactions')
      .select('total, created_at')
      .gte('created_at', fourteenDaysAgo);

    if (role === 'mitra') chartQuery = chartQuery.eq('mitra_id', user.mitra_id);
    if (role === 'admin') chartQuery = chartQuery.eq('outlet_id', user.outlet_id);

    const { data: chartData } = await chartQuery;

    return NextResponse.json({ 
      data: {
        ...stats,
        chartData: chartData || []
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
