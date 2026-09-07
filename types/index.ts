export type Role = 'super_admin' | 'admin' | 'mitra';

export type LaundryStatus = 'diterima' | 'dicuci' | 'disetrika' | 'selesai' | 'diambil';
export type VoucherType = 'points' | 'discount' | 'reward';
export type PaymentStatus = 'lunas' | 'belum_lunas' | 'dp';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  login_enabled?: boolean;
  last_login_at?: string | null;
  outlet_id?: string | null;
  mitra_id?: string | null;
  avatar_url?: string | null;
  created_at: string;
}

export interface Outlet {
  id: string;
  name: string;
  address: string;
  phone: string;
  created_at: string;
}

export interface Mitra {
  id: string;
  name: string;
  owner_name: string;
  phone: string;
  email: string;
  address: string;
  commission_pct: number;
  status: 'pending' | 'approved' | 'rejected';
  has_account?: boolean;
  user_id?: string | null;
  created_at: string;
}

export interface MitraAccountInfo {
  id: string;
  email: string;
  name: string;
  login_enabled: boolean;
  last_login_at?: string | null;
  auth_last_sign_in_at?: string | null;
  banned_until?: string | null;
}

export interface MitraWithAccount extends Mitra {
  account: MitraAccountInfo | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  unit: 'kg' | 'pcs';
  price: number;
  est_hours: number;
  active: boolean;
}

export interface TransactionDetail {
  id: string;
  service_id: string;
  service_name: string;
  qty: number;
  unit: 'kg' | 'pcs';
  price: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  invoice_no: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  outlet_id: string;
  outlet_name: string;
  outlet_phone?: string;
  mitra_id?: string | null;
  mitra_name?: string | null;
  details: TransactionDetail[];
  total: number;
  paid: number;
  payment_status: PaymentStatus;
  status: LaundryStatus;
  notes?: string;
  est_done_at: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  processed_by?: string | null;
  completed_by?: string | null;
  created_by_name?: string | null;
  processed_by_name?: string | null;
  completed_by_name?: string | null;
}

export interface Commission {
  id: string;
  mitra_id: string;
  transaction_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'requested'; // ← tambah 'requested'
  requested_at?: string | null;              // ← kapan mitra request
  paid_at?: string | null;                  // ← kapan super_admin bayar
  notes?: string | null;                    // ← catatan dari mitra/admin
  created_at: string;
}

export interface CommissionRequest {
  id: string;
  mitra_id: string;
  mitra_name: string;
  total_amount: number;
  commission_ids: string[];
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  requested_at: string;
  processed_at?: string | null;
}

export interface WhatsappLog {
  id: string;
  to: string;
  message: string;
  status: 'sent' | 'failed';
  transaction_id?: string;
  created_at: string;
}

// ─── Loyalty & Voucher Types ─────────────────────────────────────────────────
export interface Voucher {
  id: string;
  code: string;
  customer_id: string;
  customer_name: string;
  mitra_id: string;
  transaction_id: string | null;
  type: VoucherType;
  title: string;
  description: string;
  points: number;
  discount_amount: number;
  minimum_order: number;
  expired_at: string;
  is_used: boolean;
  used_at?: string;
  used_transaction_id?: string;
  created_at: string;
}

export interface LoyaltyPoints {
  id: string;
  customer_id: string;
  customer_name: string;
  points: number;
  type: 'earn' | 'redeem' | 'summary';
  description?: string;
  total_points: number;
  lifetime_points: number;
  updated_at: string;
  created_at: string;
}

export interface LoyaltySetting {
  id: string;
  mitra_id: string;
  points_per_transaction: boolean;
  points_formula: number;
  threshold_points: number;
  reward_type: 'fixed' | 'percentage';
  reward_value: number;
  reward_min_purchase: number;
  voucher_expiry_days: number;
  auto_send_whatsapp: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VoucherRedemption {
  id: string;
  voucher_id: string;
  voucher_code: string;
  customer_id: string;
  transaction_id: string;
  discount_applied: number;
  redeemed_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  link?: string;
  created_at: string;
}

// ─── Performa Staff per Outlet (dashboard superadmin) ───────────────────────
export interface StaffPerformanceRow {
  profile_id: string;
  full_name: string;
  received_count: number;
  processed_count: number;
  completed_count: number;
  total_activity: number;
  unique_customers: number;
  customer_names: string[];
}
export interface OutletStaffPerformance {
  outlet_id: string;
  outlet_name: string;
  mitra_id: string | null;
  mitra_name: string | null;
  commission_summary: { total: number; pending: number; paid: number } | null;
  transaction_count: number;
  staff: StaffPerformanceRow[];
}