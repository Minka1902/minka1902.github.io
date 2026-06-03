import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShipmentStatus } from '@/types';

const FLOW: { status: ShipmentStatus; label: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'packed', label: 'Packed' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'out_for_delivery', label: 'Out for delivery' },
  { status: 'delivered', label: 'Delivered' },
];

interface Props {
  status: ShipmentStatus;
}

export default function ShipmentStatusStepper({ status }: Props) {
  // Exceptional terminal states render their own pill.
  if (status === 'failed' || status === 'returned') {
    return (
      <div className="text-xs font-medium text-destructive">
        {status === 'failed' ? 'Delivery failed' : 'Returned'}
      </div>
    );
  }

  const currentIdx = FLOW.findIndex(s => s.status === status);

  return (
    <div className="flex items-center gap-1">
      {FLOW.map((step, i) => {
        const done = i < currentIdx;
        const current = i === currentIdx;
        return (
          <div key={step.status} className="flex items-center gap-1">
            <div
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border text-[10px]',
                done && 'border-primary bg-primary text-primary-foreground',
                current && 'border-primary text-primary',
                !done && !current && 'border-muted text-muted-foreground',
              )}
              title={step.label}
            >
              {done ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            {i < FLOW.length - 1 && (
              <div className={cn('h-px w-4', i < currentIdx ? 'bg-primary' : 'bg-muted')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
