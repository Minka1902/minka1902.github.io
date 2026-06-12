import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

// The fulfilment flow forks after "preparing": pickup orders become ready for
// pickup, delivery orders go out for delivery.
function flowFor(fulfillment: Order['fulfillment']): { status: OrderStatus; label: string }[] {
  return [
    { status: 'placed', label: 'Placed' },
    { status: 'accepted', label: 'Accepted' },
    { status: 'preparing', label: 'Preparing' },
    fulfillment === 'delivery'
      ? { status: 'out_for_delivery', label: 'Out for delivery' }
      : { status: 'ready_for_pickup', label: 'Ready for pickup' },
    { status: 'completed', label: 'Completed' },
  ];
}

interface Props {
  status: OrderStatus;
  fulfillment: Order['fulfillment'];
}

export default function OrderStatusStepper({ status, fulfillment }: Props) {
  if (status === 'cancelled' || status === 'rejected') {
    return (
      <div className="text-xs font-medium text-destructive">
        {status === 'cancelled' ? 'Cancelled' : 'Rejected'}
      </div>
    );
  }

  const flow = flowFor(fulfillment);
  const currentIdx = flow.findIndex(s => s.status === status);

  return (
    <div className="flex items-center gap-1">
      {flow.map((step, i) => {
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
            {i < flow.length - 1 && (
              <div className={cn('h-px w-4', i < currentIdx ? 'bg-primary' : 'bg-muted')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
