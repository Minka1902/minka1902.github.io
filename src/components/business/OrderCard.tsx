import { useState } from 'react';
import { Globe, Receipt, ShoppingCart, Store, Trash2, Truck, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import OrderStatusStepper from './OrderStatusStepper';
import { ORDER_PAYMENT_LABELS, type Order, type OrderStatus } from '@/types';

interface Props {
  order: Order;
  currency: string;
  canManage: boolean;
  onAccept: () => Promise<void>;
  onClose: (status: 'cancelled' | 'rejected') => void;
  onAdvance: (status: OrderStatus) => void;
  onMarkPaid: () => void;
  onCreateInvoice: () => void;
  onCreateShipment: () => void;
  onDelete: () => void;
}

// The one next step a staffer can take from each in-flight status.
function nextStep(order: Order): { status: OrderStatus; label: string } | null {
  switch (order.status) {
    case 'accepted':  return { status: 'preparing', label: 'Start preparing' };
    case 'preparing': return order.fulfillment === 'delivery'
      ? { status: 'out_for_delivery', label: 'Out for delivery' }
      : { status: 'ready_for_pickup', label: 'Ready for pickup' };
    case 'ready_for_pickup':
    case 'out_for_delivery': return { status: 'completed', label: 'Complete' };
    default: return null;
  }
}

export default function OrderCard({
  order, currency, canManage,
  onAccept, onClose, onAdvance, onMarkPaid, onCreateInvoice, onCreateShipment, onDelete,
}: Props) {
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');
  const itemCount = order.items.reduce((s, it) => s + it.quantity, 0);
  const step = nextStep(order);
  const open = order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'rejected';

  const accept = async () => {
    setAccepting(true);
    setAcceptError('');
    try {
      await onAccept();
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : 'Could not accept the order.');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShoppingCart className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{itemCount} item{itemCount !== 1 ? 's' : ''} · {order.total.toFixed(2)} {currency}</span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{order.customerName}</span>
              <span className="inline-flex items-center gap-1">
                {order.fulfillment === 'delivery'
                  ? <><Truck className="h-3 w-3" />Delivery{order.deliveryHandler === 'carrier' ? ' (carrier)' : ''}</>
                  : <><Store className="h-3 w-3" />Pickup</>}
              </span>
              {order.source === 'customer' && <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" />Online</span>}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant={order.paymentStatus === 'paid' ? 'secondary' : 'outline'}>
              {order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'refunded' ? 'Refunded' : ORDER_PAYMENT_LABELS[order.paymentMethod]}
            </Badge>
            {canManage && (
              <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Delete order">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <ul className="space-y-0.5 text-xs text-muted-foreground">
          {order.items.map((it, i) => (
            <li key={i}>{it.quantity} × {it.name} — {(it.quantity * it.unitPrice).toFixed(2)} {currency}</li>
          ))}
          {order.deliveryFee ? <li>Delivery — {order.deliveryFee.toFixed(2)} {currency}</li> : null}
        </ul>

        <OrderStatusStepper status={order.status} fulfillment={order.fulfillment} />

        {acceptError && <p className="text-xs text-destructive">{acceptError}</p>}

        {canManage && (
          <div className="flex flex-wrap gap-1.5">
            {order.status === 'placed' && (
              <>
                <Button size="sm" onClick={accept} disabled={accepting}>
                  {accepting ? 'Accepting…' : 'Accept'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => onClose('rejected')}>Reject</Button>
              </>
            )}
            {step && <Button size="sm" onClick={() => onAdvance(step.status)}>{step.label}</Button>}
            {open && order.status !== 'placed' && (
              <Button size="sm" variant="outline" onClick={() => onClose('cancelled')}>Cancel</Button>
            )}
            {order.paymentStatus === 'unpaid' && order.status !== 'placed' && open && (
              <Button size="sm" variant="outline" onClick={onMarkPaid}>Mark paid</Button>
            )}
            {!order.invoiceId && order.status !== 'placed' && (
              <Button size="sm" variant="outline" className="gap-1" onClick={onCreateInvoice}>
                <Receipt className="h-3.5 w-3.5" /> Invoice
              </Button>
            )}
            {!order.shipmentId && order.fulfillment === 'delivery' && order.deliveryHandler === 'carrier' && open && order.status !== 'placed' && (
              <Button size="sm" variant="outline" className="gap-1" onClick={onCreateShipment}>
                <Truck className="h-3.5 w-3.5" /> Shipment
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
