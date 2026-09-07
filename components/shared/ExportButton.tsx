'use client';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { exportRowsToXlsx } from '@/lib/pdf';
import { toast } from 'sonner';

export function ExportButton({ rows, filename = 'laporan.xlsx', label = 'Export Excel' }: { rows: any[]; filename?: string; label?: string }) {
  return (
    <Button variant="outline" onClick={async () => { await exportRowsToXlsx(rows, filename); toast.success('Berhasil di-export'); }}>
      <FileDown className="mr-2 h-4 w-4" /> {label}
    </Button>
  );
}
