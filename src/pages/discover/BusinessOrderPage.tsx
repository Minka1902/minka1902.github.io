import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDirectoryEntry, usePlaceOrder, usePublicCatalog } from '@/hooks/useDirectory';
import {
  computeOrderTotals, ORDER_PAYMENT_LABELS,
  type FulfillmentMethod, type OrderItem, type OrderPaymentMethod,
} from '@/types';

export default function BusinessOrderPage() {
  const { bid } = useParams<{ bid: string }>();
  const { entry, loading } = useDirectoryEntry(bid);
  const { items: catalog, loading: catalogLoading } = usePublicCatalog(bid);
  const { placeOrder } = usePlaceOrder();

  const [cart, setCart] = useState<Record<string, number>>({});
  const [fulfillment, setFulfillment] = useState<FulfillmentMethod | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod | null>(null);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = entry?.currency ?? '';
  const fulfillmentOptions: FulfillmentMethod[] =
    entry?.fulfillment === 'delivery' ? ['delivery']
    : entry?.fulfillment === 'both' ? ['pickup', 'delivery']
    : ['pickup'];
  const paymentOptions: OrderPaymentMethod[] = entry?.paymentMethods?.length ? entry.paymentMethods : ['in_person'];
  const chosenFulfillment = fulfillment ?? fulfillmentOptions[0];
  const chosenPayment = paymentMethod ?? paymentOptions[0];

  const orderItems: OrderItem[] = catalog
    .filter(p => (cart[p.id] ?? 0) > 0)
    .map(p => ({ productId: p.id, name: p.name, quantity: cart[p.id], unitPrice: p.unitPrice }));
  const deliveryFee = chosenFulfillment === 'delivery' ? (entry?.deliveryFee ?? 0) : 0;
  const { subtotal, total } = computeOrderTotals(orderItems, deliveryFee);

  const setQty = (id: string, qty: number) =>
    setCart(prev => ({ ...prev, [id]: Math.max(0, qty) }));

  const needsAddress = chosenFulfillment === 'delivery';
  const canSubmit = orderItems.length > 0 && (!needsAddress || (street.trim() && city.trim()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bid || !entry || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await placeOrder(bid, entry, {
        items: orderItems,
        fulfillment: chosenFulfillment,
        deliveryAddress: needsAddress ? { street: street.trim(), city: city.trim() } : undefined,
        paymentMethod: chosenPayment,
        notes: notes.trim() || undefined,
      });
      setDone(true);
    } catch {
      setError('Could not place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-xl space-y-4 p-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-48 w-full rounded-xl" /></div>;
  }
  if (!entry) {
    return (
      <div className="mx-auto max-w-xl py-14 text-center text-sm text-muted-foreground">
        Business not found. <Link to="/discover" className="underline">Back to discover</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 p-1 sm:p-2">
      <Button render={<Link to={`/discover/${bid}`} />} variant="ghost" size="sm" className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> {entry.name}
      </Button>

      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Order from {entry.name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {entry.fulfillment === 'delivery' ? 'Delivery' : entry.fulfillment === 'both' ? 'Pickup or delivery' : 'Pickup'}
          {entry.deliveryFee ? ` · delivery fee ${entry.deliveryFee.toFixed(2)} ${currency}` : ''}
        </p>
      </div>

      {!entry.orderable ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            This business doesn't take online orders right now.
          </CardContent>
        </Card>
      ) : done ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <div>
              <p className="font-semibold">Order placed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {entry.name} will confirm your order
                {chosenPayment === 'online'
                  ? ' and reconcile your online payment.'
                  : chosenPayment === 'on_delivery' ? '. Payment is due on delivery.' : '. Payment is due at pickup.'}
              </p>
            </div>
            <Button render={<Link to="/discover" />} variant="outline" size="sm">Back to discover</Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4" /> Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {catalogLoading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
              ) : catalog.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No products listed yet.</p>
              ) : (
                <div className="divide-y">
                  {catalog.map(p => {
                    const qty = cart[p.id] ?? 0;
                    return (
                      <div key={p.id} className={`flex items-center justify-between gap-3 py-2.5 ${!p.inStock ? 'opacity-50' : ''}`}>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.unitPrice.toFixed(2)} {currency}{p.category ? ` · ${p.category}` : ''}
                          </p>
                        </div>
                        {!p.inStock ? (
                          <Badge variant="outline">Out of stock</Badge>
                        ) : qty === 0 ? (
                          <Button type="button" size="sm" variant="outline" onClick={() => setQty(p.id, 1)}>Add</Button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Button type="button" size="icon-sm" variant="outline" onClick={() => setQty(p.id, qty - 1)} aria-label={`Remove one ${p.name}`}>
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <span className="w-6 text-center text-sm font-medium">{qty}</span>
                            <Button type="button" size="icon-sm" variant="outline" onClick={() => setQty(p.id, qty + 1)} aria-label={`Add one ${p.name}`}>
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Fulfilment &amp; payment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Fulfilment</Label>
                  <Select value={chosenFulfillment} onValueChange={v => setFulfillment(v as FulfillmentMethod)}>
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
                  <Select value={chosenPayment} onValueChange={v => setPaymentMethod(v as OrderPaymentMethod)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {paymentOptions.map(m => <SelectItem key={m} value={m}>{ORDER_PAYMENT_LABELS[m]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {needsAddress && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="order-street">Street <span className="text-destructive">*</span></Label>
                    <Input id="order-street" value={street} onChange={e => setStreet(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="order-city">City <span className="text-destructive">*</span></Label>
                    <Input id="order-city" value={city} onChange={e => setCity(e.target.value)} required />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="order-notes">Notes</Label>
                <Textarea id="order-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Anything the business should know" />
              </div>

              <div className="flex items-center justify-between border-t pt-3 text-sm">
                <span className="text-muted-foreground">
                  Subtotal {subtotal.toFixed(2)}{deliveryFee ? ` + delivery ${deliveryFee.toFixed(2)}` : ''}
                </span>
                <span className="font-semibold">Total {total.toFixed(2)} {currency}</span>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={submitting || !canSubmit}>
                {submitting ? 'Placing order…' : 'Place order'}
              </Button>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
