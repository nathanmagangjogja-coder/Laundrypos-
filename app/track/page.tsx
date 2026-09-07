'use client';
import { useState } from 'react';
import { Shirt, Search, Package } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function TrackPage() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  function handleSearch() {
    if (!query.trim()) return;
    router.push(`/track/${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="min-h-screen bg-[#020617] bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-slate-50 flex flex-col">
      <header className="border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 flex h-16 items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
            <Shirt className="h-5 w-5 text-white" />
          </div>
          <div className="font-bold tracking-tight text-lg">Laundry<span className="text-blue-500">POS</span></div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center max-w-lg">
        <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/10 animate-fade-in">
          <Package className="h-10 w-10 text-blue-500" />
        </div>
        <h1 className="text-4xl font-extrabold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 animate-fade-in">
          Lacak Laundry Anda
        </h1>
        <p className="text-slate-400 mb-10 max-w-sm text-lg animate-fade-in">
          Masukkan nomor invoice yang tertera di struk untuk melihat status laundry Anda secara real-time.
        </p>
        <div className="flex flex-col gap-3 w-full animate-fade-in">
          <div className="relative group">
            <Input
              placeholder="Masukkan kode invoice (INV/202601/00001)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="h-14 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-2xl px-6 text-center text-lg focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            className="h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-lg font-bold shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]"
          >
            Lacak Sekarang <Search className="ml-2 h-5 w-5" />
          </Button>
        </div>
        <p className="text-sm text-slate-500 mt-6 animate-fade-in">
          Contoh: <span className="text-slate-400 font-mono">INV/202601/00001</span>
        </p>
      </main>
    </div>
  );
}
