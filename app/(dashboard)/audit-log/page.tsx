'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollText } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface LogRow {
  id: string;
  user_name: string;
  action: string;
  table_name: string;
  record_id: string | null;
  created_at: string;
}

const ACTION_LABEL: Record<string, { label: string; color: string }> = {
  create_user:            { label: 'Buat Pengguna',        color: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/25' },
  update_user:            { label: 'Ubah Pengguna',        color: 'bg-blue-500/10 text-blue-700 border border-blue-500/25' },
  delete_user:            { label: 'Hapus Pengguna',       color: 'bg-rose-500/10 text-rose-700 border border-rose-500/25' },
  create_mitra_account:   { label: 'Buat Akun Mitra',      color: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/25' },
  update_mitra_account:   { label: 'Ubah Akun Mitra',      color: 'bg-blue-500/10 text-blue-700 border border-blue-500/25' },
  reset_mitra_password:   { label: 'Reset Password Mitra', color: 'bg-amber-500/10 text-amber-700 border border-amber-500/25' },
  enable_mitra_account:   { label: 'Aktifkan Akun Mitra',  color: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/25' },
  disable_mitra_account:  { label: 'Nonaktifkan Akun Mitra', color: 'bg-rose-500/10 text-rose-700 border border-rose-500/25' },
  delete_mitra_account:   { label: 'Hapus Akun Mitra',     color: 'bg-rose-500/10 text-rose-700 border border-rose-500/25' },
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit-log?limit=200')
      .then((r) => r.json())
      .then((body) => setLogs(body.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Audit Log" description="Riwayat aktivitas penting yang dilakukan pengguna sistem." />
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Memuat riwayat aktivitas...</div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ScrollText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Belum ada aktivitas tercatat.</p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-sm">
                Aksi seperti membuat/mengubah pengguna dan akun mitra akan otomatis tercatat di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Waktu</TH>
                    <TH>Pengguna</TH>
                    <TH>Aksi</TH>
                    <TH>Tabel</TH>
                  </TR>
                </THead>
                <TBody>
                  {logs.map((log) => {
                    const meta = ACTION_LABEL[log.action] ?? { label: log.action, color: 'bg-slate-500/10 text-slate-700 border border-slate-500/25' };
                    return (
                      <TR key={log.id}>
                        <TD className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(log.created_at)}</TD>
                        <TD className="font-medium">{log.user_name}</TD>
                        <TD><Badge className={meta.color}>{meta.label}</Badge></TD>
                        <TD className="text-xs text-muted-foreground">{log.table_name}</TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
