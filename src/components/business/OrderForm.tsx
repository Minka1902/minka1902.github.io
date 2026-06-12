import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCustomers, useProducts } from '@/hooks/useBusiness';
import StockBadge from './StockBadge';
import {
  computeOrderTotals, ORDER_PAYMENT_LABELS,
  type Business, type FulfillmentMethod, type Order, type OrderItem, type OrderPaymentMethod,
} from '@/types';

export type OrderFormData = Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'subtotal' | 'total' | 'status' | 'source' | 'paymentStatus'>;

interface Props {
  business: Business;
  onSubmit: (data: OrderFormData) => Promise<void>;
  onCancel: () => void;
}

const ALL_PAYMENT_METHODS: OrderPaymentMethod[] = ['online', 'in_person', 'on_delivery'];

export default function OrderForm({ business, onSubmit, onCancel }: Props) {
  const bid = business.id;
  const { customers } = useCustomers(bid);
  const { products } = useProducts(bid);
  const commerce = business.commerce;

  const fulfillmentOptions: FulfillmentMethod[] =
    commerce?.fulfillment === 'pickup' ? ['pickup']
    : commerce?.fulfillment === 'delivery' ? ['delivery']
    : ['pickup', 'delivery'];
  const paymentOptions = commerce?.paymentMethods?.length ? commerce.paymentMethods : ALL_PAYMENT_METHODS;

  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [fulfillment, setFulfillment] = useState<FulfillmentMethod>(fulfillmentOptions[0]);
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>(paymentOptions[0]);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const activeProducts = products.filter(p => p.active);
  const selectedCustomer = customers.find(c => c.id === customerId);
  const deliveryFee = fulfillment === 'delivery' ? (commerce?.deliveryFee ?? 0) : 0;
  const { subtotal, total } = computeOrderTotals(items, deliveryFee);

  const addItem = () => {
    const first = activeProducts[0];
    if (!first) return;
    setItems(prev => [...prev, { productId: first.id, name: first.name, quantity: 1, unitPrice: first.unitPrice }]);
  };
  const setItemProduct = (i: number, productId: string) => {
    const p = activeProducts.find(pr => pr.id === productId);
    if (!p) return;
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, productId, name: p.name, unitPrice: p.unitPrice } : it));
  };
  const setItemQty = (i: number, quantity: number) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, quantity: Math.max(1, quantity) } : it));
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || items.length === 0) return;
    setSaving(true);
    try {
      await onSubmit({
        items,
        customerId,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email,
        customerPhone: selectedCustomer.phone,
        fulfillment,
        deliveryAddress: fulfillment === 'delivery'
          ? { street: street.trim() || undefined, city: city.trim() || undefined }
          : undefined,
        deliveryHandler: fulfillment === 'delivery' ? commerce?.deliveryHandler : undefined,
        deliveryFee: deliveryFee || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Customer</Label>
        <Select value={customerId} onValueChange={v => setCustomerId(v ?? '')}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Pick a customer" /></SelectTrigger>
          <SelectContent>
            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Items</Label>
        {items.map((it, i) => {
          const product = activeProducts.find(p => p.id === it.productId);
          return (
            <div key={i} className="grid grid-cols-12 items-center gap-2">
              <div className="col-span-6">
                <Select value={it.productId} onValueChange={v => setItemProduct(i, v ?? '')}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Product" /></SelectTrigger>
                  <SelectContent>
                    {activeProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Input
                className="col-span-3"
                type="number"
                min="1"
                step="1"
                value={it.quantity}
                onChange={e => setItemQty(i, Number(e.target.value))}
                aria-label={`Item ${i + 1} quantity`}
              />
              <div className="col-span-2">{product && <StockBadge product={product} />}</div>
              <button type="button" onClick={() => removeItem(i)} className="col-span-1 flex justify-center text-muted-foreground hover:text-destructive" aria-label="Remove item">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
        <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" disabled={activeProducts.length === 0}>
          <Plus className="h-4 w-4" /> Add item
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Fulfilment</Label>
          <Select value={fulfillment} onValueChange={v => setFulfillment(v as FulfillmentMethod)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {fulfillmentOptions.map(f => (
                <SelectItem key={f} value={f}>{f === 'pickup' ? 'Pickup' : 'Delivery'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Payment</Label>
          <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as OrderPaymentMethod)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {paymentOptions.map(m => <SelectItem key={m} value={m}>{ORDER_PAYMENT_LABELS[m]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {fulfillment === 'delivery' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="order-street">Street</Label>
            <Input id="order-street" value={street} onChange={e => setStreet(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="order-city">City</Label>
            <Input id="order-city" value={city} onChange={e => setCity(e.target.value)} />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="order-notes">Notes</Label>
        <Textarea id="order-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Subtotal {subtotal.toFixed(2)}{deliveryFee ? ` + delivery ${deliveryFee.toFixed(2)}` : ''} ·{' '}
          <span className="font-medium text-foreground">Total {total.toFixed(2)} {business.currency}</span>
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving || !selectedCustomer || items.length === 0}>
            {saving ? 'Saving…' : 'Create order'}
          </Button>
        </div>
      </div>
    </form>
  );
}
