'use client';
import { useEffect, useState, useCallback } from 'react';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { api } from '@/lib/api';
import type { Transaction, Customer, Outlet } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { SuperAdminDashboard } from '@/components/dashboard/SuperAdminDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { MitraDashboard } from '@/components/dashboard/MitraDashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    try {
      // super_admin butuh customers+outlets untuk stat & tabel performa cabang;
      // admin/mitra cukup transaksi (sudah di-scope server-side per role).
      const needsFull = user.role === 'super_admin';
      const [transactions, customerRows, outletRows] = await Promise.all([
        api.listTransactions(),
        needsFull || user.role === 'mitra' ? api.listCustomers() : Promise.resolve([]),
        needsFull ? api.listOutlets() : Promise.resolve([]),
      ]);
      setTxns(Array.isArray(transactions) ? transactions : []);
      setCustomers(Array.isArray(customerRows) ? customerRows : []);
      setOutlets(Array.isArray(outletRows) ? outletRows : []);
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal memuat dashboard');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
    const id = setInterval(loadDashboard, 60_000); // refresh tiap 60 detik
    return () => clearInterval(id);
  }, [user, loadDashboard]);

  if (loading || !user) return <DashboardSkeleton />;

  if (user.role === 'super_admin') {
    return <SuperAdminDashboard user={user} txns={txns} customers={customers} outlets={outlets} />;
  }
  if (user.role === 'mitra') {
    return <MitraDashboard user={user} txns={txns} customers={customers} />;
  }
  return <AdminDashboard user={user} txns={txns} />;
}