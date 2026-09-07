import type { Commission, Customer, LaundryStatus, Mitra, Outlet, OutletStaffPerformance, PaymentStatus, Service, Transaction, User, Voucher } from '@/types';

type ApiResponse<T> = { data: T };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? 'Request failed');
  }

  const body = (await res.json()) as ApiResponse<T>;
  return body.data;
}

function json(method: string, body?: unknown): RequestInit {
  return { method, body: body === undefined ? undefined : JSON.stringify(body) };
}

type CreateTransactionPayload = Omit<Transaction, 'id' | 'created_at' | 'updated_at'> & {
  voucher_code?: string;
  mitra_commission_pct?: number;
};

export const api = {
  listTransactions: () => request<Transaction[]>('/api/transactions'),
  getTransaction: (id: string) => request<Transaction>(`/api/transactions/${encodeURIComponent(id)}`),
  getTransactionByInvoice: (invoice: string) => request<Transaction>(`/api/transactions/by-invoice/${encodeURIComponent(invoice)}`),
  createTransaction: (payload: CreateTransactionPayload) =>
    request<Transaction>('/api/transactions', json('POST', payload)),
  updateTransaction: (id: string, patch: Partial<Pick<Transaction, 'status' | 'payment_status' | 'paid' | 'notes'>>) =>
    request<Transaction>(`/api/transactions/${encodeURIComponent(id)}`, json('PATCH', patch)),
  deleteTransaction: (id: string) =>
    request<{ id: string }>(`/api/transactions/${encodeURIComponent(id)}`, json('DELETE')),

  listCustomers: () => request<Customer[]>('/api/customers'),
  createCustomer: (payload: Omit<Customer, 'id' | 'created_at'>) =>
    request<Customer>('/api/customers', json('POST', payload)),
  updateCustomer: (id: string, patch: Partial<Customer>) =>
    request<Customer>(`/api/customers/${encodeURIComponent(id)}`, json('PATCH', patch)),
  deleteCustomer: (id: string) =>
    request<{ id: string }>(`/api/customers/${encodeURIComponent(id)}`, json('DELETE')),

  listOutlets: () => request<Outlet[]>('/api/outlets'),
  createOutlet: (payload: Omit<Outlet, 'id' | 'created_at'>) =>
    request<Outlet>('/api/outlets', json('POST', payload)),
  updateOutlet: (id: string, patch: Partial<Outlet>) =>
    request<Outlet>(`/api/outlets/${encodeURIComponent(id)}`, json('PATCH', patch)),
  deleteOutlet: (id: string) =>
    request<{ id: string }>(`/api/outlets/${encodeURIComponent(id)}`, json('DELETE')),

  getStaffPerformance: (period: 'today' | 'month' | 'last_month' | 'all' = 'all') =>
    request<OutletStaffPerformance[]>(`/api/dashboard/staff-performance?period=${period}`),

  listServices: () => request<Service[]>('/api/services'),
  createService: (payload: Omit<Service, 'id'>) =>
    request<Service>('/api/services', json('POST', payload)),
  updateService: (id: string, patch: Partial<Service>) =>
    request<Service>(`/api/services/${encodeURIComponent(id)}`, json('PATCH', patch)),
  deleteService: (id: string) =>
    request<{ id: string }>(`/api/services/${encodeURIComponent(id)}`, json('DELETE')),

  listMitra: () => request<Mitra[]>('/api/mitra'),
  createMitra: (payload: Omit<Mitra, 'id' | 'created_at'>) =>
    request<Mitra>('/api/mitra', json('POST', payload)),
  updateMitra: (id: string, patch: Partial<Mitra>) =>
    request<Mitra>(`/api/mitra/${encodeURIComponent(id)}`, json('PATCH', patch)),
  deleteMitra: (id: string) =>
    request<{ id: string }>(`/api/mitra/${encodeURIComponent(id)}`, json('DELETE')),
  approveMitra: (id: string) => api.updateMitra(id, { status: 'approved' }),
  rejectMitra: (id: string) => api.updateMitra(id, { status: 'rejected' }),

  listCommissions: () => request<(Commission & { mitra_name: string; invoice_no: string })[]>('/api/commissions'),
payCommission: (id: string) =>
  request<(Commission & { mitra_name: string; invoice_no: string })[]>('/api/commissions', json('PATCH', { id, status: 'paid' })),
payAllPendingCommissions: () =>
  request<(Commission & { mitra_name: string; invoice_no: string })[]>('/api/commissions', json('PATCH', { status: 'paid' })),
 
// ← TAMBAHKAN INI:
requestCommissionPayment: (payload: { notes?: string }) =>
  request<{ requested_count: number; total_amount: number; mitra_name: string }>(
    '/api/commissions',
    json('POST', payload)
  ),

  listUsers: () => request<User[]>('/api/users'),
  createUser: (payload: Omit<User, 'id' | 'created_at'>) =>
    request<User>('/api/users', json('POST', payload)),
  updateUser: (id: string, patch: Partial<User>) =>
    request<User>(`/api/users/${encodeURIComponent(id)}`, json('PATCH', patch)),
  deleteUser: (id: string) =>
    request<{ id: string }>(`/api/users/${encodeURIComponent(id)}`, json('DELETE')),

  listNotifications: () => request<any[]>('/api/notifications'),
  markNotificationsAsRead: (ids?: string[]) => request<void>('/api/notifications', json('PATCH', { ids })),
  getProfile: () => request<any>('/api/profile'),
  updateProfile: (payload: any) => request<any>('/api/profile', json('PATCH', payload)),
  changePassword: (payload: any) => request<any>('/api/profile/change-password', json('POST', payload)),
  getDashboardStats: () => request<any>('/api/stats'),
  createManualVoucher: (payload: any) => request<Voucher>('/api/vouchers/manual', json('POST', payload)),
};

export type TransactionPatch = {
  status?: LaundryStatus;
  payment_status?: PaymentStatus;
  paid?: number;
};
