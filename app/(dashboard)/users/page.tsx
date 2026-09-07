'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/shared/Modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, UserCog, Mail, Calendar, Shield, Store, Building2, Eye, EyeOff, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, cn } from '@/lib/utils';
import type { User, Role, Outlet, Mitra } from '@/types';
import { ROLES } from '@/constants';
import { api } from '@/lib/api';

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: Role;
  outlet_id: string | null;
  mitra_id: string | null;
  avatar_url: string | null;
}

const EMPTY: UserForm = { name: '', email: '', password: '', role: 'admin', outlet_id: null, mitra_id: null, avatar_url: null };

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  super_admin: { label: 'Super Admin', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  admin:       { label: 'Admin',       color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20'   },
  mitra:       { label: 'Mitra',       color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
};

function UserSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-3 w-44 rounded bg-muted" />
          </div>
          <div className="h-5 w-20 rounded-full bg-muted" />
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-lg bg-muted" />
            <div className="h-8 w-8 rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [mitraList, setMitraList] = useState<Mitra[]>([]);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Quick-add cabang baru langsung dari modal (mis. "Malang")
  const [newOutletName, setNewOutletName] = useState('');
  const [addingOutlet, setAddingOutlet] = useState(false);

  async function refresh() {
    try {
      const [u, o, m] = await Promise.all([api.listUsers(), api.listOutlets(), api.listMitra()]);
      setUsers(u);
      setOutlets(o);
      setMitraList(m);
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  function openAdd() { setEditTarget(null); setForm(EMPTY); setShowPass(false); setOpen(true); }
  function openEdit(u: User) {
    setEditTarget(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, outlet_id: u.outlet_id ?? null, mitra_id: u.mitra_id ?? null, avatar_url: u.avatar_url ?? null });
    setShowPass(false);
    setOpen(true);
  }

  async function handleQuickAddOutlet() {
    const name = newOutletName.trim();
    if (!name) return;
    setAddingOutlet(true);
    try {
      const outlet = await api.createOutlet({ name, address: '', phone: '' } as any);
      setOutlets((prev) => [outlet, ...prev]);
      setForm((f) => ({ ...f, outlet_id: outlet.id }));
      setNewOutletName('');
      toast.success(`Cabang "${name}" ditambahkan.`);
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal menambah cabang.');
    } finally {
      setAddingOutlet(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Nama dan email wajib diisi'); return; }
    if (!editTarget && form.password.trim().length < 6) { toast.error('Password minimal 6 karakter untuk akun baru.'); return; }
    if (form.role === 'mitra' && !form.mitra_id) { toast.error('Pilih mitra yang akan ditautkan ke akun ini.'); return; }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        outlet_id: form.role === 'mitra' ? null : form.outlet_id,
        mitra_id: form.role === 'mitra' ? form.mitra_id : null,
        avatar_url: form.avatar_url,
        ...(form.password.trim() ? { password: form.password.trim() } : {}),
      };
      if (editTarget) { await api.updateUser(editTarget.id, payload as any); toast.success('✅ User diperbarui'); }
      else { await api.createUser(payload as any); toast.success('🎉 User ditambahkan'); }
      await refresh(); setOpen(false);
    } catch (error: any) {
      toast.error(error.message ?? 'Gagal menyimpan user');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.deleteUser(deleteTarget.id);
      await refresh();
      toast.success('🗑️ User dihapus');
      setDeleteTarget(null);
    } catch (error: any) { toast.error(error.message ?? 'Gagal menghapus user'); }
  }

  const safeUsers = Array.isArray(users) ? users : [];
  const outletName = (id?: string | null) => outlets.find((o) => o.id === id)?.name;
  const mitraName = (id?: string | null) => mitraList.find((m) => m.id === id)?.name;

  return (
    <>
      {/* Hero Header */}
      <div className={cn(
        'relative overflow-hidden rounded-2xl p-6 mb-6',
        'bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-transparent',
        'border border-indigo-500/15 animate-fade-in',
      )}>
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-indigo-400/10 blur-2xl pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-400/30 shrink-0">
              <UserCog className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Manajemen User</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">{safeUsers.length}</span> pengguna terdaftar &middot; akun via Supabase Auth
              </p>
            </div>
          </div>
          <Button onClick={openAdd} className="rounded-xl shadow-lg shadow-primary/25 hover:scale-105 transition-all duration-300">
            <Plus className="mr-2 h-4 w-4" /> Tambah User
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <CardContent className="p-4 md:p-6">
          {loading ? <UserSkeleton /> : (
            <div className="space-y-0 rounded-xl border overflow-hidden">
              <div className="hidden md:grid grid-cols-[2fr_2.2fr_1.1fr_1.4fr_1.1fr_80px] gap-4 px-4 py-3 bg-muted/40 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Nama</span>
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</span>
                <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Role</span>
                <span className="flex items-center gap-1.5"><Store className="h-3.5 w-3.5" /> Cabang / Mitra</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Dibuat</span>
                <span>Aksi</span>
              </div>

              {safeUsers.map((u, idx) => {
                const roleCfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.admin;
                const scope = u.role === 'mitra' ? mitraName(u.mitra_id) : outletName(u.outlet_id);
                return (
                  <div
                    key={u.id}
                    className={cn(
                      'grid grid-cols-1 md:grid-cols-[2fr_2.2fr_1.1fr_1.4fr_1.1fr_80px] gap-2 md:gap-4 px-4 py-4',
                      'border-b last:border-0 transition-colors duration-150',
                      'hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10',
                      'animate-fade-in',
                    )}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {u.name.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm">{u.name}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground truncate">{u.email}</div>
                    <div className="flex items-center">
                      <span className={cn('text-xs font-bold px-2.5 py-1 rounded-lg border', roleCfg.color, roleCfg.bg)}>
                        {roleCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground gap-1">
                      {scope ? (
                        <>
                          {u.role === 'mitra' ? <Building2 className="h-3 w-3 shrink-0" /> : <Store className="h-3 w-3 shrink-0" />}
                          <span className="truncate">{scope}</span>
                        </>
                      ) : (
                        <span className="opacity-50">—</span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">{formatDate(u.created_at)}</div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(u)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteTarget(u)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={open} onOpenChange={setOpen} title={editTarget ? 'Edit User' : 'Tambah User'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nama *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Password {editTarget ? <span className="normal-case font-normal">(kosongkan jika tidak diubah)</span> : '*'}
            </Label>
            <div className="relative">
              <Input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder={editTarget ? '••••••••' : 'Minimal 6 karakter'}
                className="rounded-xl pr-10"
              />
              <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</Label>
            <Select value={form.role} onValueChange={(v: Role) => setForm(f => ({ ...f, role: v, outlet_id: null, mitra_id: null }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Outlet — untuk role admin/super_admin, dengan quick-add cabang baru */}
          {form.role !== 'mitra' && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cabang / Outlet</Label>
              <Select value={form.outlet_id ?? '__none__'} onValueChange={(v) => setForm(f => ({ ...f, outlet_id: v === '__none__' ? null : v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih cabang..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Tanpa cabang (akses semua)</SelectItem>
                  {outlets.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2 pt-1">
                <Input
                  value={newOutletName}
                  onChange={(e) => setNewOutletName(e.target.value)}
                  placeholder="Nama cabang baru, mis. Malang"
                  className="rounded-xl h-9 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleQuickAddOutlet())}
                />
                <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" disabled={addingOutlet || !newOutletName.trim()} onClick={handleQuickAddOutlet}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Cabang Baru
                </Button>
              </div>
            </div>
          )}

          {/* Mitra — untuk role mitra, tautkan ke bisnis mitra yang sudah terdaftar */}
          {form.role === 'mitra' && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tautkan ke Mitra *</Label>
              {mitraList.length === 0 ? (
                <div className="text-xs text-muted-foreground p-3 rounded-xl border bg-muted/30">
                  Belum ada bisnis mitra terdaftar. Tambahkan dulu lewat halaman{' '}
                  <a href="/mitra" className="font-semibold text-primary hover:underline">Kelola Mitra</a>, baru kembali ke sini untuk buat akun login-nya.
                </div>
              ) : (
                <Select value={form.mitra_id ?? undefined} onValueChange={(v) => setForm(f => ({ ...f, mitra_id: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih mitra..." /></SelectTrigger>
                  <SelectContent>
                    {mitraList.filter(m => !m.user_id || m.user_id === editTarget?.id).map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}{m.user_id ? ' (sudah ada akun)' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl shadow-md shadow-primary/25">
              {saving ? 'Menyimpan...' : editTarget ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Hapus User?" variant="danger">
        <div className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
          <Trash2 className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            User <strong className="text-foreground">{deleteTarget?.name}</strong> akan dihapus permanen dari Supabase Auth beserta profilnya.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-xl">Batal</Button>
          <Button variant="destructive" onClick={handleDelete} className="rounded-xl"><Trash2 className="mr-2 h-4 w-4" /> Hapus</Button>
        </div>
      </Modal>
    </>
  );
}