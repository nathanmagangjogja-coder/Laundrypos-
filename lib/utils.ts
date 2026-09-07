import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function waLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('0')
    ? '62' + cleanPhone.slice(1)
    : cleanPhone.startsWith('62')
    ? cleanPhone
    : '62' + cleanPhone;

  const encodedMsg = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMsg}`;
}

export function normalizeScanValue(val: string): string {
  return val.trim().toUpperCase();
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch (error) {
    return '—';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date);
}

// Langsung navigasi ke WA di tab yang sama — tidak bisa diblokir popup blocker
export function openWa(phone: string, message: string) {
  if (!phone || phone.trim() === '') return;
  window.location.href = waLink(phone, message);
}

export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)   return 'Baru saja';
  if (diffMins < 60)  return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

export function formatCurrency(amount: number): string {
  return formatRupiah(amount);
}