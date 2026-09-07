'use client';
import { ReactNode } from 'react';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Inbox, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmptyVariant = 'default' | 'search' | 'locked';

interface EmptyStateProps {
  title?: string;
  description?: string;
  variant?: EmptyVariant;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'Tidak ada data',
  description = 'Belum ada entri untuk ditampilkan di sini.',
  variant = 'default',
  action,
  className,
}: EmptyStateProps) {
  const Icon = variant === 'search' ? SearchX : Inbox;
  const color =
    variant === 'search'
      ? 'from-sky-400/30 to-indigo-400/20 text-sky-500'
      : 'from-slate-200/60 to-slate-300/30 text-slate-400';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16 px-6 animate-fade-in',
        className
      )}
    >
      <div
        className={cn(
          'relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br shadow-inner',
          color
        )}
      >
        <div className="absolute inset-0 rounded-3xl bg-dot opacity-40 pointer-events-none" />
        <Icon className="relative h-9 w-9" strokeWidth={1.5} />
      </div>
      <div className="space-y-1 text-center max-w-xs">
        <h4 className="font-semibold text-base tracking-tight">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function DataTable<T>({
  columns,
  data,
  empty,
  emptyTitle,
  emptyDescription,
  emptyVariant,
  emptyAction,
}: {
  columns: { key: string; label: string; render?: (row: T) => ReactNode; className?: string }[];
  data: T[];
  empty?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyVariant?: EmptyVariant;
  emptyAction?: ReactNode;
}) {
  if (!data.length) {
    if (emptyTitle || emptyDescription || emptyAction) {
      return (
        <EmptyState
          title={emptyTitle ?? empty}
          description={emptyDescription}
          variant={emptyVariant}
          action={emptyAction}
        />
      );
    }
    return <EmptyState title={empty} />;
  }
  return (
    <Table>
      <THead>
        <TR>
          {columns.map((c) => (
            <TH key={c.key} className={c.className}>
              {c.label}
            </TH>
          ))}
        </TR>
      </THead>
      <TBody>
        {data.map((row: any, i) => (
          <TR key={row.id ?? i} className="group">
            {columns.map((c) => (
              <TD key={c.key} className={c.className}>
                {c.render ? c.render(row) : row[c.key]}
              </TD>
            ))}
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
