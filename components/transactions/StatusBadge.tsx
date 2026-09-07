import { Badge } from '@/components/ui/badge';
import { LAUNDRY_STATUSES, PAYMENT_STATUSES } from '@/constants';
import type { LaundryStatus, PaymentStatus } from '@/types';

import { cn } from '@/lib/utils';

export function StatusBadge({ status, className }: { status: LaundryStatus; className?: string }) {
  const s = LAUNDRY_STATUSES.find((x) => x.value === status) ?? LAUNDRY_STATUSES[0];
  return (
    <Badge dot className={cn(s.color, className)}>
      {s.label}
    </Badge>
  );
}
export function PaymentBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  const s = PAYMENT_STATUSES.find((x) => x.value === status) ?? PAYMENT_STATUSES[0];
  return (
    <Badge dot className={cn(s.color, className)}>
      {s.label}
    </Badge>
  );
}
