'use client';

/**
 * hooks/useLoyalty.ts
 * Reactive hook for loyalty data (Supabase version)
 */

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { toast } from 'sonner';

import {
  getVouchers,
  getActiveVouchers,
  getVouchersByCustomer,
  getLoyaltyAnalytics,
  getTotalPoints,
  type LoyaltyAnalytics,
} from '@/lib/loyalty-store';

import type {
  Voucher,
  LoyaltyPoints,
  LoyaltySetting,
} from '@/types';

// ─────────────────────────────────────────────────────────────
// Global Loyalty Hook
// ─────────────────────────────────────────────────────────────

export function useLoyalty() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [activeVouchers, setActiveVouchers] = useState<Voucher[]>([]);
  const [allPoints, setAllPoints] = useState<any[]>([]);
  const [analytics, setAnalytics] =
    useState<LoyaltyAnalytics | null>(null);

  const refresh = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowser();
      const [
        vouchersData,
        activeData,
        analyticsData,
        { data: pointsData },
      ] = await Promise.all([
        getVouchers(),
        getActiveVouchers(),
        getLoyaltyAnalytics(),
        supabase
          .from('loyalty_points')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      // Aggregate points by customer_id (support both transactional rows
      // with `points`+`type` and legacy aggregated rows with `total_points`)
      const transSums = new Map<string, { total: number; lifetime: number; name: string }>();
      const aggRows = new Map<string, any>();

      (pointsData || []).forEach((record: any) => {
        const key = record.customer_id;
        if (!key) return;

        // Transactional schema: has `points` and `type`
        if (record.points !== undefined && record.points !== null) {
          const pointsNum = Number(record.points) || 0;
          const isRedeem = record.type === 'redeem';
          const current = transSums.get(key) || { total: 0, lifetime: 0, name: record.customer_name || 'Unknown' };
          current.total += isRedeem ? -pointsNum : pointsNum;
          current.lifetime += Math.abs(pointsNum);
          transSums.set(key, current);
          return;
        }

        // Legacy/aggregated schema: keep as agg row
        if (record.total_points !== undefined && record.total_points !== null) {
          aggRows.set(key, record);
        }
      });

      // Merge into final aggregated list preferring transactional sums when available
      const aggregatedPoints = Array.from(new Set<string>([...transSums.keys(), ...aggRows.keys()])).map(key => {
        const trans = transSums.get(key);
        const agg = aggRows.get(key);

        if (trans) {
          return {
            id: key,
            customer_id: key,
            customer_name: trans.name,
            total_points: trans.total,
            lifetime_points: trans.lifetime,
            updated_at: agg?.updated_at || null,
            created_at: agg?.created_at || null,
          };
        }

        // fallback to aggregated row
        return {
          id: agg?.id || key,
          customer_id: key,
          customer_name: agg?.customer_name || 'Unknown',
          total_points: Number(agg?.total_points) || 0,
          lifetime_points: Number(agg?.lifetime_points) || 0,
          updated_at: agg?.updated_at || null,
          created_at: agg?.created_at || null,
        };
      }).sort((a, b) => (b.total_points ?? 0) - (a.total_points ?? 0));

      setVouchers(vouchersData);
      setActiveVouchers(activeData);
      setAllPoints(aggregatedPoints);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed loading loyalty data:', err);
    }
  }, []);

  useEffect(() => {
    refresh();

    const supabase = createSupabaseBrowser();
    
    // Subscribe to vouchers changes
    const vouchersChannel = supabase
      .channel('loyalty_vouchers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vouchers',
        },
        () => refresh()
      )
      .subscribe();

    // Subscribe to loyalty_points changes
    const pointsChannel = supabase
      .channel('loyalty_points_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loyalty_points',
        },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(vouchersChannel);
      supabase.removeChannel(pointsChannel);
    };
  }, [refresh]);

  return {
    vouchers,
    activeVouchers,
    allPoints,
    analytics,
    refresh,
  };
}

// ─────────────────────────────────────────────────────────────
// Customer Loyalty Hook (Enhanced)
// ─────────────────────────────────────────────────────────────

export function useCustomerLoyalty(customerId: string | null) {
  const [history, setHistory] = useState<LoyaltyPoints[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoyalty = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      
      // Fetch all loyalty points for this customer
      const { data: pointsData, error: pointsError } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (pointsError) throw pointsError;

      // Fetch all vouchers for this customer
      const { data: vouchersData, error: vouchersError } = await supabase
        .from('vouchers')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (vouchersError) throw vouchersError;

      // Calculate total points supporting both transactional and aggregated schemas
      let calculatedTotal = 0;
      const pts = pointsData || [];
      if (Array.isArray(pts) && pts.length > 0) {
        const transactional = pts.filter((r: any) => r.points !== undefined && r.points !== null);
        if (transactional.length > 0) {
          calculatedTotal = transactional.reduce((sum: number, p: any) => {
            const val = Number(p.points) || 0;
            return sum + (p.type === 'redeem' ? -val : val);
          }, 0);
        } else {
          // fallback to aggregated summary row (legacy schema)
          const agg = pts.find((r: any) => r.total_points !== undefined && r.total_points !== null);
          if (agg) calculatedTotal = Number(agg.total_points) || 0;
        }
      }

      setTotalPoints(Number.isFinite(calculatedTotal) ? Math.max(0, calculatedTotal) : 0);
      setHistory(pointsData || []);
      setVouchers(vouchersData || []);
    } catch (err: any) {
      console.error('Failed loading customer loyalty:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchLoyalty();

    if (!customerId) return;

    const supabase = createSupabaseBrowser();
    const channel = supabase
      .channel(`loyalty_updates_${customerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loyalty_points',
          filter: `customer_id=eq.${customerId}`,
        },
        () => fetchLoyalty()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vouchers',
          filter: `customer_id=eq.${customerId}`,
        },
        () => fetchLoyalty()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId, fetchLoyalty]);

  return {
    points: totalPoints,
    totalPoints,
    vouchers,
    history,
    loading,
    error,
    refresh: fetchLoyalty,
  };
}

// ─────────────────────────────────────────────────────────────
// Loyalty Settings Hook
// ─────────────────────────────────────────────────────────────

export function useLoyaltySettings() {
  const [settings, setSettings] = useState<LoyaltySetting | null>(null);
  const [mitraId, setMitraId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    const supabase = createSupabaseBrowser();
    try {
      // Get current user mitra_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: mitra } = await supabase
        .from('mitra')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!mitra) return;
      
      setMitraId(mitra.id);

      const { data, error } = await supabase
        .from('loyalty_settings')
        .select('*')
        .eq('mitra_id', mitra.id)
        .maybeSingle();

      if (error) throw error;
      setSettings(data);
    } catch (err) {
      console.error('Failed to fetch loyalty settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = async (data: Partial<LoyaltySetting>) => {
    setSaving(true);
    const supabase = createSupabaseBrowser();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      const { data: mitra } = await supabase
        .from('mitra')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!mitra) throw new Error('Mitra profile not found');

      const { error } = await supabase
        .from('loyalty_settings')
        .upsert({
          ...data,
          mitra_id: mitra.id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'mitra_id' });

      if (error) throw error;
      toast.success('Pengaturan loyalty berhasil disimpan');
      fetchSettings();
    } catch (err: any) {
      console.error('Failed to update loyalty settings:', err);
      toast.error(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (!mitraId) return;

    const supabase = createSupabaseBrowser();
    const channel = supabase
      .channel(`loyalty_settings_${mitraId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loyalty_settings',
          filter: `mitra_id=eq.${mitraId}`,
        },
        () => fetchSettings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mitraId, fetchSettings]);

  return {
    settings,
    loading,
    updateSettings,
    saving
  };
}
