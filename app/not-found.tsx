'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-8 border-2 border-dashed border-border">
        <Search className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-bold mb-4">404 — Halaman Hilang</h1>
      <p className="text-muted-foreground mb-8 max-w-md">Maaf, halaman yang Anda cari tidak ditemukan atau telah dipindahkan.</p>
      <div className="flex gap-4">
        <Button asChild variant="outline">
          <Link href="/">Halaman Utama</Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">Ke Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
