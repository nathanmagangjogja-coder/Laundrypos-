'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Eye, EyeOff, Loader2, RefreshCw, Trash2, UserX, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  createMitraAccount,
  deleteMitraAccount,
  resetMitraPassword,
  setMitraAccountEnabled,
  updateMitraAccount,
} from '@/app/actions/mitra-accounts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDateTime } from '@/lib/utils';
import type { MitraAccountInfo, MitraWithAccount } from '@/types';

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mitra: MitraWithAccount | null;
  onAccountChange: (mitraId: string, account: MitraAccountInfo | null) => void;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Safe charset — no ambiguous chars (0/O/1/l), no special chars that break URLs/WhatsApp
function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

function validatePassword(password: string): boolean {
  return password.trim().length >= 8;
}

function ActionButton({
  loading,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { loading?: boolean }) {
  return (
    <Button disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  show,
  onToggleShow,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  show: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Minimal 8 karakter'}
        className="pr-10"
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
        aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function MitraAccountModal({ open, onOpenChange, mitra, onAccountChange }: ModalProps) {
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createConfirmPassword, setCreateConfirmPassword] = useState('');
  const [showCreatePwd, setShowCreatePwd] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);

  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');

  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [activeTab, setActiveTab] = useState('info');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const defaultAccountName = useMemo(
    () => mitra?.owner_name?.trim() || mitra?.name?.trim() || '',
    [mitra],
  );

  useEffect(() => {
    if (!mitra) return;
    // createEmail intentionally left empty — user must fill manually to avoid
    // accidentally using mitra's contact email which may already be taken
    setCreateEmail('');
    setCreatePassword('');
    setCreateConfirmPassword('');
    setShowCreatePwd(false);
    setShowCreateConfirm(false);
    setEditEmail(mitra.account?.email ?? mitra.email ?? '');
    setEditName(mitra.account?.name ?? defaultAccountName);
    setResetPasswordValue('');
    setResetConfirmPassword('');
    setShowResetPwd(false);
    setShowResetConfirm(false);
    setActiveTab(mitra.account ? 'info' : 'create');
    setPendingAction(null);
  }, [mitra, defaultAccountName]);

  // Early return AFTER all hooks — mitra null check must come after hooks
  if (!mitra) return null;

  // Capture non-null mitra in a stable local variable for use in callbacks
  // This resolves TS18047 — TypeScript cannot narrow `mitra` inside closures
  // even after an early return, because it re-checks the prop type at call site.
  const currentMitra: MitraWithAccount = mitra;
  const account = currentMitra.account ?? null;
  const accountEnabled = account?.login_enabled ?? false;
  const lastLogin = account?.last_login_at ?? account?.auth_last_sign_in_at ?? null;

  function revealGeneratedPassword(target: 'create' | 'reset'): void {
    const password = generatePassword();
    if (target === 'create') {
      setCreatePassword(password);
      setCreateConfirmPassword(password);
      setShowCreatePwd(true);
    } else {
      setResetPasswordValue(password);
      setResetConfirmPassword(password);
      setShowResetPwd(true);
    }
    toast.success(`Password otomatis: ${password}`, {
      duration: 10000,
      description: 'Salin dan kirimkan ke mitra sekarang.',
    });
  }

  function runAction(actionName: string, task: () => Promise<void>): void {
    setPendingAction(actionName);
    startTransition(async () => {
      try {
        await task();
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleCreateAccount(): void {
    const email = createEmail.trim().toLowerCase();
    const name = defaultAccountName;

    if (!validateEmail(email)) {
      toast.error('Format email tidak valid.');
      return;
    }
    if (!validatePassword(createPassword)) {
      toast.error('Password minimal 8 karakter.');
      return;
    }
    if (createPassword !== createConfirmPassword) {
      toast.error('Konfirmasi password tidak cocok.');
      return;
    }

    runAction('create', async () => {
      const result = await createMitraAccount({
        mitra_id: currentMitra.id,
        email,
        password: createPassword,
        name,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      onAccountChange(currentMitra.id, result.data ?? null);
      toast.success('Akun login mitra berhasil dibuat.');
      setActiveTab('info');
    });
  }

  function handleUpdateEmail(): void {
    if (!account) return;
    const email = editEmail.trim().toLowerCase();
    const name = editName.trim();

    if (!validateEmail(email)) {
      toast.error('Format email tidak valid.');
      return;
    }
    if (!name) {
      toast.error('Nama akun wajib diisi.');
      return;
    }

    runAction('update-email', async () => {
      const result = await updateMitraAccount({
        user_id: account.id,
        email,
        name,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      onAccountChange(currentMitra.id, result.data ?? account);
      toast.success('Informasi akun berhasil diperbarui.');
    });
  }

  function handleResetPassword(): void {
    if (!account) return;
    if (!validatePassword(resetPasswordValue)) {
      toast.error('Password minimal 8 karakter.');
      return;
    }
    if (resetPasswordValue !== resetConfirmPassword) {
      toast.error('Konfirmasi password tidak cocok.');
      return;
    }

    runAction('reset-password', async () => {
      const result = await resetMitraPassword(account.id, resetPasswordValue);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Password akun mitra berhasil direset.');
      setResetPasswordValue('');
      setResetConfirmPassword('');
    });
  }

  function handleToggleAccount(): void {
    if (!account) return;

    runAction('toggle-enabled', async () => {
      const result = await setMitraAccountEnabled(account.id, !accountEnabled);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      onAccountChange(currentMitra.id, result.data ?? { ...account, login_enabled: !accountEnabled });
      toast.success(!accountEnabled ? 'Akun berhasil diaktifkan.' : 'Akun berhasil dinonaktifkan.');
    });
  }

  function handleDeleteAccount(): void {
    if (!account) return;

    if (
      !confirm(
        `Hapus akun login "${currentMitra.name}" secara permanen?\n\nMitra tidak akan bisa login lagi. Tindakan ini tidak dapat dibatalkan.`,
      )
    ) {
      return;
    }

    runAction('delete', async () => {
      const result = await deleteMitraAccount(account.id, currentMitra.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      onAccountChange(currentMitra.id, null);
      toast.success('Akun login mitra berhasil dihapus.');
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {account ? 'Kelola Akun Mitra' : 'Buat Akun Login Mitra'}
          </DialogTitle>
          <DialogDescription>
            {currentMitra.name} — {currentMitra.owner_name}
          </DialogDescription>
        </DialogHeader>

        {/* ── CREATE ACCOUNT MODE ── */}
        {!account ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              Akun login akan dibuat untuk mitra ini. Password minimal 8 karakter dan sebaiknya
              segera dibagikan ke mitra secara aman.
            </div>

            <div className="space-y-2">
              <Label>Email Login</Label>
              <Input
                type="email"
                placeholder="mitra@contoh.com"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Pastikan email ini belum digunakan untuk akun lain.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Password</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => revealGeneratedPassword('create')}
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Generate otomatis
                </Button>
              </div>
              <PasswordInput
                value={createPassword}
                onChange={setCreatePassword}
                show={showCreatePwd}
                onToggleShow={() => setShowCreatePwd((v) => !v)}
              />
            </div>

            <div className="space-y-2">
              <Label>Konfirmasi Password</Label>
              <PasswordInput
                value={createConfirmPassword}
                onChange={setCreateConfirmPassword}
                placeholder="Ulangi password"
                show={showCreateConfirm}
                onToggleShow={() => setShowCreateConfirm((v) => !v)}
              />
              {createConfirmPassword && createPassword !== createConfirmPassword && (
                <p className="text-xs text-rose-500">Password tidak cocok.</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <ActionButton
                loading={pendingAction === 'create'}
                disabled={
                  !createEmail ||
                  !createPassword ||
                  createPassword !== createConfirmPassword
                }
                onClick={handleCreateAccount}
              >
                Buat Akun Login
              </ActionButton>
            </DialogFooter>
          </div>
        ) : (
          /* ── MANAGE ACCOUNT MODE ── */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="email">Ganti Email</TabsTrigger>
              <TabsTrigger value="password">Reset Password</TabsTrigger>
              <TabsTrigger
                value="delete"
                className="data-[state=active]:text-destructive hover:text-destructive"
              >
                Hapus
              </TabsTrigger>
            </TabsList>

            {/* Tab: Info */}
            <TabsContent value="info" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-mono font-medium break-all">{account.email}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Password</div>
                  <div className="font-medium tracking-widest">••••••••••••</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div
                    className={`font-medium flex items-center gap-1.5 mt-0.5 ${
                      accountEnabled
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        accountEnabled ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    {accountEnabled ? 'Aktif' : 'Dinonaktifkan'}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">Terakhir Login</div>
                  <div className="font-medium">
                    {lastLogin ? formatDateTime(lastLogin) : 'Belum pernah login'}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <ActionButton
                  variant={accountEnabled ? 'destructive' : 'default'}
                  loading={pendingAction === 'toggle-enabled'}
                  onClick={handleToggleAccount}
                >
                  {accountEnabled ? (
                    <>
                      <UserX className="mr-2 h-4 w-4" />
                      Nonaktifkan Login
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Aktifkan Login
                    </>
                  )}
                </ActionButton>
              </DialogFooter>
            </TabsContent>

            {/* Tab: Ganti Email */}
            <TabsContent value="email" className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Akun</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nama pemilik akun"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Baru</Label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="emailbaru@contoh.com"
                />
                <p className="text-xs text-muted-foreground">
                  Mitra harus menggunakan email baru ini untuk login berikutnya.
                </p>
              </div>

              <DialogFooter>
                <ActionButton
                  loading={pendingAction === 'update-email'}
                  disabled={!editEmail || !editName}
                  onClick={handleUpdateEmail}
                >
                  Simpan Perubahan
                </ActionButton>
              </DialogFooter>
            </TabsContent>

            {/* Tab: Reset Password */}
            <TabsContent value="password" className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                Setelah password direset, segera bagikan password baru ke mitra melalui
                kanal yang aman (contoh: WhatsApp langsung ke pemilik).
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Password Baru</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => revealGeneratedPassword('reset')}
                  >
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Generate otomatis
                  </Button>
                </div>
                <PasswordInput
                  value={resetPasswordValue}
                  onChange={setResetPasswordValue}
                  show={showResetPwd}
                  onToggleShow={() => setShowResetPwd((v) => !v)}
                />
              </div>

              <div className="space-y-2">
                <Label>Konfirmasi Password Baru</Label>
                <PasswordInput
                  value={resetConfirmPassword}
                  onChange={setResetConfirmPassword}
                  placeholder="Ulangi password baru"
                  show={showResetConfirm}
                  onToggleShow={() => setShowResetConfirm((v) => !v)}
                />
                {resetConfirmPassword && resetPasswordValue !== resetConfirmPassword && (
                  <p className="text-xs text-rose-500">Password tidak cocok.</p>
                )}
              </div>

              <DialogFooter>
                <ActionButton
                  loading={pendingAction === 'reset-password'}
                  disabled={
                    !resetPasswordValue ||
                    resetPasswordValue !== resetConfirmPassword
                  }
                  onClick={handleResetPassword}
                >
                  Reset Password
                </ActionButton>
              </DialogFooter>
            </TabsContent>

            {/* Tab: Hapus */}
            <TabsContent value="delete" className="space-y-4">
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-muted-foreground space-y-2">
                <p>
                  Menghapus akun login akan menghapus akses masuk mitra secara{' '}
                  <strong className="text-foreground">permanen</strong>. Data mitra tetap ada,
                  tetapi akun auth dan row users akan dihapus.
                </p>
                <p>
                  Jika hanya ingin menonaktifkan sementara, gunakan tombol{' '}
                  <strong className="text-foreground">Nonaktifkan Login</strong> di tab Info.
                </p>
              </div>

              <DialogFooter>
                <ActionButton
                  variant="destructive"
                  loading={pendingAction === 'delete'}
                  onClick={handleDeleteAccount}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Akun Login Permanen
                </ActionButton>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}