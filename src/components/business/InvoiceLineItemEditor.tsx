import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { InvoiceLineItem } from '@/types';

interface Props {
  items: InvoiceLineItem[];
  onChange: (items: InvoiceLineItem[]) => void;
  currency: string;
}

export default function InvoiceLineItemEditor({ items, onChange, currency }: Props) {
  const update = (i: number, patch: Partial<InvoiceLineItem>) =>
    onChange(items.map((li, idx) => (idx === i ? { ...li, ...patch } : li)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { description: '', quantity: 1, unitPrice: 0 }]);

  return (
    <div className="space-y-2">
      <Label>Line items</Label>
      {items.map((li, i) => (
        <div key={i} className="grid grid-cols-12 items-center gap-2">
          <Input
            className="col-span-6"
            placeholder="Description"
            value={li.description}
            onChange={e => update(i, { description: e.target.value })}
            aria-label={`Item ${i + 1} description`}
          />
          <Input
            className="col-span-2"
            type="number"
            min="0"
            step="1"
            placeholder="Qty"
            value={li.quantity}
            onChange={e => update(i, { quantity: Number(e.target.value) })}
            aria-label={`Item ${i + 1} quantity`}
          />
          <Input
            className="col-span-3"
            type="number"
            min="0"
            step="0.01"
            placeholder="Unit price"
            value={li.unitPrice}
            onChange={e => update(i, { unitPrice: Number(e.target.value) })}
            aria-label={`Item ${i + 1} unit price`}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="col-span-1 flex justify-center text-muted-foreground hover:text-destructive"
            aria-label={`Remove item ${i + 1}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button type="button" onClick={add} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <Plus className="h-4 w-4" /> Add line item
        </button>
        <span className="text-xs text-muted-foreground">{currency}</span>
      </div>
    </div>
  );
}
