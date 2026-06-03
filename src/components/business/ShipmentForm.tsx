import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomers, useProducts } from '@/hooks/useBusiness';
import type { Shipment, ShipmentItem, ShipmentStatus } from '@/types';

export type ShipmentFormData = Omit<Shipment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;

interface Props {
  bid: string;
  initial?: Partial<Shipment>;
  onSubmit: (data: ShipmentFormData) => Promise<void>;
  onCancel: () => void;
}

const NONE = '__none__';

const STATUSES: { value: ShipmentStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
  { value: 'returned', label: 'Returned' },
];

export default function ShipmentForm({ bid, initial, onSubmit, onCancel }: Props) {
  const { customers } = useCustomers(bid);
  const { products } = useProducts(bid);
  const [customerId, setCustomerId] = useState(initial?.customerId ?? '');
  const [items, setItems] = useState<ShipmentItem[]>(initial?.items ?? []);
  const [carrier, setCarrier] = useState(initial?.carrier ?? '');
  const [trackingNumber, setTrackingNumber] = useState(initial?.trackingNumber ?? '');
  const [status, setStatus] = useState<ShipmentStatus>(initial?.status ?? 'pending');
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    const first = products[0];
    setItems(prev => [...prev, { productId: first?.id ?? '', productName: first?.name ?? '', quantity: 1 }]);
  };
  const setItemProduct = (i: number, productId: string) => {
    const p = products.find(pr => pr.id === productId);
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, productId, productName: p?.name ?? '' } : it));
  };
  const setItemQty = (i: number, quantity: number) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, quantity } : it));
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const selectedCustomer = customers.find(c => c.id === customerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        customerId: customerId || undefined,
        customerName: selectedCustomer?.name,
        items: items.filter(it => it.productId),
        carrier: carrier.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
        status,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Customer</Label>
        <Select value={customerId || NONE} onValueChange={v => setCustomerId(v && v !== NONE ? v : '')}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>None</SelectItem>
            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Items</Label>
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-2">
            <div className="col-span-7">
              <Select value={it.productId} onValueChange={v => setItemProduct(i, v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Product" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Input
              className="col-span-4"
              type="number"
              min="1"
              step="1"
              value={it.quantity}
              onChange={e => setItemQty(i, Number(e.target.value))}
              aria-label={`Item ${i + 1} quantity`}
            />
            <button type="button" onClick={() => removeItem(i)} className="col-span-1 flex justify-center text-muted-foreground hover:text-destructive" aria-label="Remove item">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" disabled={products.length === 0}>
          <Plus className="h-4 w-4" /> Add item
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ship-carrier">Carrier</Label>
          <Input id="ship-carrier" value={carrier} onChange={e => setCarrier(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ship-tracking">Tracking number</Label>
          <Input id="ship-tracking" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={status} onValueChange={v => setStatus(v as ShipmentStatus)}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  );
}
