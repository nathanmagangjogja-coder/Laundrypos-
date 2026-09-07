import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  gradient?: string;
  glowColor?: string;
}

export function PageHeader({
  title,
  description,
  action,
  icon,
  gradient = 'from-primary/10 via-sky-500/5 to-transparent',
  glowColor = 'bg-primary/8',
}: PageHeaderProps) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl p-6 mb-6',
      `bg-gradient-to-br ${gradient}`,
      'border border-primary/10 animate-fade-in',
    )}>
      <div className={cn('absolute -top-8 -right-8 h-32 w-32 rounded-full blur-2xl pointer-events-none', glowColor)} />
      <div className="relative flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 shrink-0 text-white">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}