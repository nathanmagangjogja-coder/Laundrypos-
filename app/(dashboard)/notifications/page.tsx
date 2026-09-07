'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, Clock, AlertCircle, Info, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatRelative } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { Notification } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadNotifications = async () => {
    try {
      const data = await api.listNotifications();
      setNotifications(data);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memuat notifikasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (ids?: string[]) => {
    try {
      await api.markNotificationsAsRead(ids);
      setNotifications(prev => 
        prev.map(n => (!ids || ids.includes(n.id) ? { ...n, is_read: true } : n))
      );
      if (!ids) toast.success('Semua notifikasi ditandai dibaca');
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui notifikasi');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-rose-500" />;
      case 'warning': return <Clock className="h-5 w-5 text-amber-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Notifikasi" 
          description="Pantau semua aktivitas dan pemberitahuan sistem."
        />
        {notifications.some(n => !n.is_read) && (
          <Button variant="outline" size="sm" onClick={() => markAsRead()}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Tandai semua dibaca
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="p-4 flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-muted p-6">
                <Bell className="h-12 w-12 text-muted-foreground opacity-20" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Tidak ada notifikasi</h3>
              <p className="text-sm text-muted-foreground">Semua aktivitas sistem akan muncul di sini.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div 
                  key={n.id}
                  className={cn(
                    "flex gap-4 p-4 transition-colors cursor-pointer hover:bg-muted/50",
                    !n.is_read && "bg-primary/5"
                  )}
                  onClick={() => {
                    if (!n.is_read) markAsRead([n.id]);
                    if (n.link) router.push(n.link);
                  }}
                >
                  <div className={cn(
                    "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
                    n.is_read ? "bg-muted border-border" : "bg-white dark:bg-slate-900 border-primary/20 shadow-sm"
                  )}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={cn("text-sm font-bold", !n.is_read ? "text-foreground" : "text-muted-foreground")}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap uppercase tracking-tighter font-bold">
                        {formatRelative(new Date(n.created_at), new Date(), { locale: id })}
                      </span>
                    </div>
                    <p className={cn("text-sm leading-relaxed", !n.is_read ? "text-muted-foreground" : "text-muted-foreground/60")}>
                      {n.message}
                    </p>
                    {!n.is_read && (
                      <div className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        Baru
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
