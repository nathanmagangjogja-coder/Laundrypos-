/**
 * Simple localStorage-backed store for all LaundryPOS data.
 * Replaces dummy data with persisted, mutable state.
 * In production this would be replaced by Supabase calls.
 */
import type { Customer, Outlet, Mitra, Service, Transaction, Commission, User } from '@/types';
import {
  dummyCustomers, dummyOutlets, dummyMitra, dummyServices,
  dummyTransactions, dummyCommissions, dummyUsers,
} from '@/constants/dummy';

function load<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save(key: string, data: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Customers ────────────────────────────────────────────────────────────────
export function getCustomers(): Customer[] { return load('lpos_customers', dummyCustomers); }
export function saveCustomers(data: Customer[]) { save('lpos_customers', data); }
export function addCustomer(c: Omit<Customer, 'id' | 'created_at'>): Customer {
  const customers = getCustomers();
  const id = 'c' + Date.now();
  const nc: Customer = { ...c, id, created_at: new Date().toISOString() };
  saveCustomers([nc, ...customers]);
  return nc;
}
export function updateCustomer(id: string, patch: Partial<Customer>) {
  saveCustomers(getCustomers().map(c => c.id === id ? { ...c, ...patch } : c));
}
export function deleteCustomer(id: string) {
  saveCustomers(getCustomers().filter(c => c.id !== id));
}

// ─── Outlets ──────────────────────────────────────────────────────────────────
export function getOutlets(): Outlet[] { return load('lpos_outlets', dummyOutlets); }
export function saveOutlets(data: Outlet[]) { save('lpos_outlets', data); }
export function addOutlet(o: Omit<Outlet, 'id' | 'created_at'>): Outlet {
  const outlets = getOutlets();
  const id = 'o' + Date.now();
  const no: Outlet = { ...o, id, created_at: new Date().toISOString() };
  saveOutlets([no, ...outlets]);
  return no;
}
export function updateOutlet(id: string, patch: Partial<Outlet>) {
  saveOutlets(getOutlets().map(o => o.id === id ? { ...o, ...patch } : o));
}
export function deleteOutlet(id: string) {
  saveOutlets(getOutlets().filter(o => o.id !== id));
}

// ─── Mitra ────────────────────────────────────────────────────────────────────
export function getMitra(): Mitra[] { return load('lpos_mitra', dummyMitra); }
export function saveMitra(data: Mitra[]) { save('lpos_mitra', data); }
export function addMitra(m: Omit<Mitra, 'id' | 'created_at'>): Mitra {
  const mitra = getMitra();
  const id = 'm' + Date.now();
  const nm: Mitra = { ...m, id, created_at: new Date().toISOString() };
  saveMitra([nm, ...mitra]);
  return nm;
}
export function updateMitra(id: string, patch: Partial<Mitra>) {
  saveMitra(getMitra().map(m => m.id === id ? { ...m, ...patch } : m));
}
export function deleteMitra(id: string) {
  saveMitra(getMitra().filter(m => m.id !== id));
}
export function approveMitra(id: string) { updateMitra(id, { status: 'approved' }); }
export function rejectMitra(id: string) { updateMitra(id, { status: 'rejected' }); }

// ─── Services ─────────────────────────────────────────────────────────────────
export function getServices(): Service[] { return load('lpos_services', dummyServices); }
export function saveServices(data: Service[]) { save('lpos_services', data); }
export function addService(s: Omit<Service, 'id'>): Service {
  const services = getServices();
  const id = 's' + Date.now();
  const ns: Service = { ...s, id };
  saveServices([ns, ...services]);
  return ns;
}
export function updateService(id: string, patch: Partial<Service>) {
  saveServices(getServices().map(s => s.id === id ? { ...s, ...patch } : s));
}
export function deleteService(id: string) {
  saveServices(getServices().filter(s => s.id !== id));
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export function getTransactions(): Transaction[] { return load('lpos_transactions', dummyTransactions); }
export function saveTransactions(data: Transaction[]) { save('lpos_transactions', data); }
export function addTransaction(t: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Transaction {
  const txns = getTransactions();
  const id = 't' + Date.now();
  const nt: Transaction = { ...t, id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  saveTransactions([nt, ...txns]);
  return nt;
}
export function updateTransaction(id: string, patch: Partial<Transaction>) {
  saveTransactions(getTransactions().map(t => t.id === id ? { ...t, ...patch, updated_at: new Date().toISOString() } : t));
}
export function deleteTransaction(id: string) {
  saveTransactions(getTransactions().filter(t => t.id !== id));
  // Also delete associated commissions
  const commissions = getCommissions().filter(c => c.transaction_id !== id);
  save('lpos_commissions', commissions);
}

// ─── Commissions ──────────────────────────────────────────────────────────────
export function getCommissions(): Commission[] { return load('lpos_commissions', dummyCommissions); }
export function saveCommissions(data: Commission[]) { save('lpos_commissions', data); }
export function payCommission(id: string) {
  saveCommissions(getCommissions().map(c => c.id === id ? { ...c, status: 'paid' } : c));
}
export function payAllPendingCommissions() {
  saveCommissions(getCommissions().map(c => ({ ...c, status: 'paid' as const })));
}

// ─── Users ────────────────────────────────────────────────────────────────────
export function getUsers(): User[] { return load('lpos_users', dummyUsers); }
export function saveUsers(data: User[]) { save('lpos_users', data); }
export function addUser(u: Omit<User, 'id' | 'created_at'>): User {
  const users = getUsers();
  const id = 'u' + Date.now();
  const nu: User = { ...u, id, created_at: new Date().toISOString() };
  saveUsers([nu, ...users]);
  return nu;
}
export function updateUser(id: string, patch: Partial<User>) {
  saveUsers(getUsers().map(u => u.id === id ? { ...u, ...patch } : u));
}
export function deleteUser(id: string) {
  saveUsers(getUsers().filter(u => u.id !== id));
}


// ─── WhatsApp Settings ────────────────────────────────────────────────────────
export interface WaSettings {
  url: string;
  token: string;
  tplNew: string;
  tplReady: string;
}

const defaultWaSettings: WaSettings = {
  url: 'https://api.fonnte.com/send',
  token: '',
  tplNew: `Halo *{{name}}* \n\nTerima kasih telah menggunakan jasa *LaundryPOS* ✨\n\n🧾 *Invoice:* {{invoice}}\n💰 *Total:* Rp {{total}}\n⏱ *Estimasi selesai:* {{est}}\n\n🔍 Lacak status:\n{{trackUrl}}\n\n_Pesan otomatis dari LaundryPOS_`,
  tplReady: `Halo *{{name}}* \n\n✅ Laundry dengan invoice:\n\n*{{invoice}}*\n\nsudah *SELESAI* dan siap diambil 🙏\n\n📍 Silakan datang ke outlet atau hubungi petugas jika ingin diantar.\n\n_Pesan otomatis dari LaundryPOS_`,
};

export function getWaSettings(): WaSettings {
  return load('lpos_wa_settings', [defaultWaSettings])[0] ?? defaultWaSettings;
}

export function saveWaSettings(s: WaSettings) {
  save('lpos_wa_settings', [s]);
}
/**
 * Render WA template — preserves emoji, newlines, and WhatsApp markdown
 */
export function renderWaTemplate(
  template: string,
  data: Record<string, string>
): string {
  return template
    .replace(/\{\{(.*?)\}\}/g, (_, key) => data[key.trim()] ?? '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Invoice sequence ─────────────────────────────────────────────────────────
export function nextInvoiceNo(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const txns = getTransactions();
  const seq = txns.length + 1;
  return `INV/${y}${m}/${String(seq).padStart(5, '0')}`;
}
