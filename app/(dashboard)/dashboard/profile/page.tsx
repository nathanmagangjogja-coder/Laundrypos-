'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Phone, Mail, Shield, Save, Key, Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await api.getProfile();
      setProfile(data);
      setName(data.name || '');
      setPhone(data.phone || '');
    } catch (error) {
      toast.error('Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile({ name, phone });
      toast.success('Profil berhasil diperbarui');
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('Konfirmasi password tidak cocok');
    }
    setSaving(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      toast.success('Password berhasil diubah');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengubah password');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const initials = (name || profile?.email || 'U').slice(0, 1).toUpperCase();

  return (
    <div className="animate-fade-in-up space-y-6 max-w-4xl mx-auto pb-10">
      <PageHeader title="Profil Saya" description="Kelola informasi akun dan keamanan Anda." />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 bg-card border-border">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-indigo-700 flex items-center justify-center text-white text-3xl font-bold shadow-sm ring-4 ring-primary/10 mb-4">
              {initials}
            </div>
            <h3 className="text-lg font-bold text-foreground">{profile?.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{profile?.email}</p>
            <div className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-widest">
              {profile?.role?.replace('_', ' ')}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Informasi Dasar</CardTitle>
            <CardDescription className="text-muted-foreground">Update nama dan nomor telepon Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">Email (Read-only)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                  <Input id="email" value={profile?.email} disabled className="pl-10 bg-muted/50 border-border" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-muted-foreground">Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="pl-10 bg-background border-border focus:border-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-muted-foreground">Nomor WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxx" className="pl-10 bg-background border-border focus:border-primary" />
                </div>
              </div>
              <Button type="submit" disabled={saving} className="w-full md:w-auto bg-primary text-primary-foreground shadow-sm">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Simpan Perubahan
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Ganti Password</CardTitle>
            <CardDescription className="text-muted-foreground">Pastikan gunakan password yang kuat untuk keamanan akun.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <Label htmlFor="current" className="text-muted-foreground">Password Saat Ini</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                  <Input 
                    id="current" 
                    type={showPassword ? "text" : "password"} 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    required 
                    className="pl-10 bg-background border-border" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground/50">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new" className="text-muted-foreground">Password Baru</Label>
                  <Input 
                    id="new" 
                    type={showPassword ? "text" : "password"} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                    className="bg-background border-border" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-muted-foreground">Konfirmasi Password Baru</Label>
                  <Input 
                    id="confirm" 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                    className="bg-background border-border" 
                  />
                </div>
              </div>
              <Button type="submit" variant="secondary" disabled={saving} className="shadow-sm">
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
