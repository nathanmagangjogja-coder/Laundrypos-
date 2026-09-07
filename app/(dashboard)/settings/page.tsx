'use client';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageCircle, QrCode, Building2 } from 'lucide-react';

const items = [
  { href: '/settings/whatsapp', icon: MessageCircle, title: 'WhatsApp Gateway', desc: 'Atur token dan template pesan.' },
  { href: '/services',          icon: QrCode,        title: 'Format Barcode/QR', desc: 'Format & ukuran cetak barcode.' },
  { href: '/outlets',           icon: Building2,     title: 'Outlet',            desc: 'Tambah / edit outlet Anda.' },
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Pengaturan" description="Konfigurasi sistem LaundryPOS." />
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link key={it.href} href={it.href}>
              <Card className="h-full transition-transform hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                  <CardTitle className="mt-2 text-base">{it.title}</CardTitle>
                  <CardDescription>{it.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
