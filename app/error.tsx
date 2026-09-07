'use client';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-8 border-2 border-dashed border-rose-200">
        <AlertCircle className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-bold mb-4">Ups, Terjadi Kesalahan!</h1>
      <p className="text-muted-foreground mb-8 max-w-md">Sistem mengalami kendala tak terduga. Kami telah mencatat error ini.</p>
      <div className="flex gap-4">
        <Button onClick={() => window.location.reload()} variant="outline">
          Muat Ulang Halaman
        </Button>
        <Button onClick={() => reset()}>
          <RotateCcw className="mr-2 h-4 w-4" /> Coba Lagi
        </Button>
      </div>
    </div>
  );
}
