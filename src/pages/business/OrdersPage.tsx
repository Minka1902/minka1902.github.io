import { useState } from 'react';
import { Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBusiness, useOrders } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import OrderCard from '@/components/business/OrderCard';
import OrderForm, { type OrderFormData } from '@/components/business/OrderForm';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

type Filter = 'open' | 'placed' | 'completed' | 'closed' | 'all';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'placed', label: 'New' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Cancelled' },
  { value: 'all', label: 'All' },
];

function matches(order: Order, filter: Filter): boolean {
  switch (filter) {
    case 'open': return !['completed', 'cancelled', 'rejected'].includes(order.status);
    case 'placed': return order.status === 'placed';
    case 'completed': return order.status === 'completed';
    case 'closed': return order.status === 'cancelled' || order.status === 'rejected';
    case 'all': return true;
  }
}

export default function OrdersPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const {
    orders, loading, createOrder, acceptOrder, closeOrder, updateOrderStatus,
    setOrderPaid, createInvoiceFromOrder, createShipmentFromOrder, deleteOrder,
  } = useOrders(bid);

  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>('open');

  const canView = can('view_orders');
  const canManage = can('manage_orders');

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canView && !canManage) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to orders.</div>;
  }

  const visible = orders.filter(o => matches(o, filter));

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Orders</h1>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New order
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              filter === f.value ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No orders</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === 'open' ? 'Nothing waiting on you right now.' : 'No orders match this filter.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(o => (
            <OrderCard
              key={o.id}
              order={o}
              currency={activeBusiness.currency}
              canManage={canManage}
              onAccept={() => acceptOrder(o)}
              onClose={(status) => { if (confirm(`${status === 'rejected' ? 'Reject' : 'Cancel'} this order?`)) void closeOrder(o, status); }}
              onAdvance={(status: OrderStatus) => updateOrderStatus(o, status)}
              onMarkPaid={() => setOrderPaid(o.id, 'paid')}
              onCreateInvoice={() => void createInvoiceFromOrder(o)}
              onCreateShipment={() => void createShipmentFromOrder(o)}
              onDelete={() => { if (confirm('Delete this order?')) void deleteOrder(o.id); }}
            />
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New order</DialogTitle></DialogHeader>
          <OrderForm
            business={activeBusiness}
            onSubmit={async (data: OrderFormData) => { await createOrder(data); setAddOpen(false); }}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
