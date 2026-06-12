import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ORDER_PAYMENT_LABELS, type Business, type CommerceSettings, type DeliveryHandler, type OrderPaymentMethod } from '@/types';

interface Props {
  business: Business;
  onSave: (commerce: CommerceSettings) => Promise<void>;
}

const ALL_PAYMENT_METHODS: OrderPaymentMethod[] = ['online', 'in_person', 'on_delivery'];

// The owner's "how do we sell?" answers: take online orders? deliver, and who
// carries it? how do customers pay? Saved onto the business and projected to the
// public directory so the order page only offers what's configured.
export default function CommerceSettingsCard({ business, onSave }: Props) {
  const initial = business.commerce;
  const [ordersOpen, setOrdersOpen] = useState(initial?.ordersOpen ?? false);
  const [fulfillment, setFulfillment] = useState<CommerceSettings['fulfillment']>(initial?.fulfillment ?? 'pickup');
  const [deliveryHandler, setDeliveryHandler] = useState<DeliveryHandler>(initial?.deliveryHandler ?? 'business');
  const [deliveryFee, setDeliveryFee] = useState(initial?.deliveryFee != null ? String(initial.deliveryFee) : '');
  const [paymentMethods, setPaymentMethods] = useState<OrderPaymentMethod[]>(initial?.paymentMethods ?? ['in_person']);
  const [saving, setSaving] = useState(false);

  const togglePayment = (m: OrderPaymentMethod, on: boolean) => {
    setPaymentMethods(prev => on ? [...new Set([...prev, m])] : prev.filter(x => x !== m));
  };

  const offersDelivery = fulfillment !== 'pickup';

  const save = async () => {
    setSaving(true);
    try {
      await onSave({
        ordersOpen,
        fulfillment,
        deliveryHandler: offersDelivery ? deliveryHandler : undefined,
        deliveryFee: offersDelivery && deliveryFee !== '' ? Number(deliveryFee) : undefined,
        paymentMethods: paymentMethods.length ? paymentMethods : ['in_person'],
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Orders &amp; delivery</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="pr-4">
            <p className="text-sm font-medium">Accept online orders</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Customers can browse your in-stock products in the directory and order them.
            </p>
          </div>
          <Switch checked={ordersOpen} onCheckedChange={setOrdersOpen} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Fulfilment</Label>
            <Select value={fulfillment} onValueChange={v => setFulfillment(v as CommerceSettings['fulfillment'])}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup">Pickup only</SelectItem>
                <SelectItem value="delivery">Delivery only</SelectItem>
                <SelectItem value="both">Pickup &amp; delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {offersDelivery && (
            <div className="space-y-1.5">
              <Label>Delivery handled by</Label>
              <Select value={deliveryHandler} onValueChange={v => setDeliveryHandler(v as DeliveryHandler)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Our own staff</SelectItem>
                  <SelectItem value="carrier">External carrier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {offersDelivery && (
          <div className="space-y-1.5">
            <Label htmlFor="commerce-fee">Delivery fee ({business.currency})</Label>
            <Input
              id="commerce-fee"
              type="number"
              min="0"
              step="0.01"
              className="max-w-40"
              value={deliveryFee}
              onChange={e => setDeliveryFee(e.target.value)}
              placeholder="0.00"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Payment options</Label>
          <p className="text-xs text-muted-foreground">
            "Pay online" records the payment with the order — card processing can be connected later.
          </p>
          <div className="space-y-1.5">
            {ALL_PAYMENT_METHODS.map(m => (
              <label key={m} className="flex items-center gap-2 text-sm">
                <Switch checked={paymentMethods.includes(m)} onCheckedChange={v => togglePayment(m, v === true)} />
                {ORDER_PAYMENT_LABELS[m]}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
