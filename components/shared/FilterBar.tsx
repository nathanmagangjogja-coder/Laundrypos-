'use client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LAUNDRY_STATUSES } from '@/constants';
import { Search } from 'lucide-react';

export function FilterBar({ search, onSearchChange, status, onStatusChange }: {
  search: string; onSearchChange: (s: string) => void;
  status: string; onStatusChange: (s: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Cari invoice / nama customer..." value={search} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
      </div>
      <div className="md:w-56">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {LAUNDRY_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
