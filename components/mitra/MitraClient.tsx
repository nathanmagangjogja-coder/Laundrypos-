'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, CheckCircle2, Mail, UserX, Trash2, UserPlus2, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { Modal } from '@/components/shared/Modal';
import { api } from '@/lib/api';
import { toast } from 'sonner';
// Fix: corrected module path (was '@/components/mitra/MitraAccountModal')
import { MitraAccountModal } from './MitraAccountModal';
import { formatDateTime } from '@/lib/utils';
import type { MitraAccountInfo, MitraWithAccount } from '@/types';

const statusColor: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

function AccountStatus({ account }: { account: MitraAccountInfo | null }) {
  if (!account) {
    return (
      <span className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 text-xs">
        Belum ada akun login
      </span>
    );
  }

  const enabled = account.login_enabled;
  const lastLogin = account.last_login_at ?? account.auth_last_sign_in_at;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full shrink-0 ${
            enabled ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />
        <span className="text-sm font-mono font-medium truncate max-w-[160px]">
          {account.email}
        </span>
      </div>
      <div
        className={`flex items-center gap-1 text-xs ${
          enabled ? 'text-muted-foreground' : 'text-rose-500 dark:text-rose-400'
        }`}
      >
        {!enabled && <UserX className="h-3 w-3 shrink-0" />}
        {enabled ? 'Login aktif' : 'Login dinonaktifkan'}
      </div>
      <div className="text-xs text-muted-foreground">
        Login terakhir:{' '}
        {lastLogin ? formatDateTime(lastLogin) : 'Belum pernah login'}
      </div>
    </div>
  );
}

export function MitraClient({ initialMitra }: { initialMitra: MitraWithAccount[] }) {
  const [rows, setRows] = useState<MitraWithAccount[]>(initialMitra);
  const [selectedMitra, setSelectedMitra] = useState<MitraWithAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MitraWithAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteMitra(deleteTarget.id);
      setRows(rows.filter((r) => r.id !== deleteTarget.id));
      toast.success('Mitra berhasil dihapus');
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.message ?? 'Gagal menghapus mitra');
    } finally {
      setIsDeleting(false);
    }
  }

  const stats = useMemo(
    () => ({
      total:     rows.length,
      active:    rows.filter((r) => r.account?.login_enabled).length,
      noAccount: rows.filter((r) => !r.account).length,
    }),
    [rows],
  );

  function handleAccountChange(mitraId: string, account: MitraAccountInfo | null): void {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== mitraId) return row;
        return {
          ...row,
          has_account: Boolean(account),
          user_id: account?.id ?? null,
          account,
        };
      }),
    );

    // Also update selectedMitra so modal receives fresh data immediately
    setSelectedMitra((current) => {
      if (!current || current.id !== mitraId) return current;
      return {
        ...current,
        has_account: Boolean(account),
        user_id: account?.id ?? null,
        account,
      };
    });
  }

  function handleModalOpenChange(open: boolean): void {
    if (!open) setSelectedMitra(null);
  }

  return (
    <>
      {/* ── Stats row ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              {/* Fix: was ShieldAlert which is a warning/security icon — not relevant for "Total Mitra" */}
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Mitra</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Akun Aktif</div>
              <div className="text-2xl font-bold">{stats.active}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Belum Punya Akun</div>
              <div className="text-2xl font-bold">{stats.noAccount}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Table ── */}
      <Card>
        <CardContent className="p-4 md:p-6">
          {rows.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                <UserPlus2 className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <h3 className="text-sm font-bold mb-1">Belum Ada Mitra Terdaftar</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                Mitra mendaftar sendiri lewat halaman pendaftaran, lalu Anda tinggal setujui dan buatkan akun login di sini.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button asChild size="sm">
                  <Link href="/register" target="_blank">
                    <UserPlus2 className="h-3.5 w-3.5" /> Buka Halaman Pendaftaran
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const url = typeof window !== 'undefined' ? `${window.location.origin}/register` : '/register';
                    navigator.clipboard.writeText(url);
                    toast.success('Link pendaftaran disalin');
                  }}
                >
                  <Copy className="h-3.5 w-3.5" /> Salin Link
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Mitra</TH>
                  <TH>Kontak</TH>
                  <TH>Komisi</TH>
                  <TH>Status</TH>
                  <TH>Akun Login</TH>
                  <TH className="w-[180px]">Aksi</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((mitra) => (
                  <TR key={mitra.id} className="group">
                    <TD>
                      <div className="space-y-1">
                        <div className="font-medium">{mitra.name}</div>
                        <div className="text-sm text-muted-foreground">{mitra.owner_name}</div>
                      </div>
                    </TD>
                    <TD>
                      <div className="space-y-1 text-sm">
                        <div>{mitra.phone || '—'}</div>
                        <div className="text-muted-foreground">{mitra.email || '—'}</div>
                      </div>
                    </TD>
                    <TD className="text-sm font-medium">{mitra.commission_pct}%</TD>
                    <TD>
                      <Badge
                        className={
                          statusColor[mitra.status] ?? 'bg-muted text-muted-foreground'
                        }
                      >
                        {mitra.status}
                      </Badge>
                    </TD>
                    <TD>
                      <AccountStatus account={mitra.account} />
                    </TD>
                    <TD>
                      <div className="flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                        <Button
                          variant={mitra.account ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => setSelectedMitra(mitra)}
                        >
                          {mitra.account ? 'Kelola' : 'Buat Akun'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteTarget(mitra)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirm */}
      <Modal
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Hapus Mitra?"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Mitra <strong>{deleteTarget?.name}</strong> akan dihapus permanen dari sistem.
            Aksi ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Menghapus...' : 'Hapus Permanen'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal — key forces useEffect re-run when account data changes within same mitra session */}
      <MitraAccountModal
        key={`${selectedMitra?.id}-${selectedMitra?.account?.email ?? 'no-account'}`}
        open={!!selectedMitra}
        onOpenChange={handleModalOpenChange}
        mitra={selectedMitra}
        onAccountChange={handleAccountChange}
      />
    </>
  );
}