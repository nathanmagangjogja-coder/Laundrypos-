'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  Search, 
  LayoutDashboard, 
  Receipt, 
  QrCode, 
  Settings, 
  Gift, 
  Calculator, 
  Users, 
  FileText,
  Command as CommandIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { api } from '@/lib/api';
import type { Customer, Transaction } from '@/types';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (open) {
      api.listCustomers().then(setCustomers).catch(() => {});
      api.listTransactions().then(setTransactions).catch(() => {});
    }
  }, [open]);

  const menuItems = [
    { title: 'Dashboard', subtitle: 'Halaman utama ringkasan', icon: LayoutDashboard, href: '/dashboard' },
    { title: 'Transaksi', subtitle: 'Daftar semua laundry', icon: Receipt, href: '/transactions' },
    { title: 'Transaksi Baru', subtitle: 'Buat order laundry baru', icon: Calculator, href: '/transactions/new' },
    { title: 'Scan Invoice', subtitle: 'Cari transaksi lewat QR/Barcode', icon: QrCode, href: '/scan' },
    { title: 'Loyalty & Voucher', subtitle: 'Poin reward & diskon', icon: Gift, href: '/loyalty' },
    { title: 'Customer', subtitle: 'Kelola data pelanggan', icon: Users, href: '/customers' },
    { title: 'Pengaturan', subtitle: 'Konfigurasi sistem & WA', icon: Settings, href: '/settings' },
  ];

  const onSelect = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative flex h-10 w-full items-center gap-3 rounded-xl border bg-muted/50 px-3 text-sm text-muted-foreground transition-all hover:bg-muted md:w-80"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Cari apapun...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Ketik untuk mencari menu, customer, atau invoice..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>Tidak menemukan hasil untuk &quot;{query}&quot;</CommandEmpty>
          
          <CommandGroup heading="Menu Utama">
            {menuItems.map((item) => (
              <CommandItem key={item.href} onSelect={() => onSelect(item.href)}>
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{item.subtitle}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          {customers.length > 0 && (
            <CommandGroup heading="Pelanggan">
              {customers.filter(c => 
                c.name.toLowerCase().includes(query.toLowerCase()) || 
                c.phone.includes(query)
              ).slice(0, 5).map((customer) => (
                <CommandItem key={customer.id} onSelect={() => onSelect(`/customers?id=${customer.id}`)}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>{customer.name}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{customer.phone}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          {transactions.length > 0 && (
            <CommandGroup heading="Transaksi">
              {transactions.filter(t => 
                t.invoice_no.toLowerCase().includes(query.toLowerCase()) || 
                t.customer_name.toLowerCase().includes(query.toLowerCase())
              ).slice(0, 5).map((t) => (
                <CommandItem key={t.id} onSelect={() => onSelect(`/transactions/${t.id}`)}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>{t.invoice_no}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{t.customer_name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
