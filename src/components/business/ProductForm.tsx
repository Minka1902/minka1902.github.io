import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Product } from '@/types';

export type ProductFormData = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

interface Props {
  initial?: Partial<Product>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
}

export default function ProductForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [sku, setSku] = useState(initial?.sku ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [unitPrice, setUnitPrice] = useState(initial?.unitPrice?.toString() ?? '');
  const [stockQty, setStockQty] = useState(initial?.stockQty?.toString() ?? '');
  const [lowStockThreshold, setLowStockThreshold] = useState(initial?.lowStockThreshold?.toString() ?? '');
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        sku: sku.trim() || undefined,
        category: category.trim() || undefined,
        unitPrice: unitPrice ? Number(unitPrice) : 0,
        stockQty: stockQty ? Number(stockQty) : 0,
        lowStockThreshold: lowStockThreshold ? Number(lowStockThreshold) : undefined,
        active,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="prod-name">Name <span className="text-destructive">*</span></Label>
        <Input id="prod-name" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="prod-sku">SKU</Label>
          <Input id="prod-sku" value={sku} onChange={e => setSku(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prod-category">Category</Label>
          <Input id="prod-category" value={category} onChange={e => setCategory(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="prod-price">Unit price</Label>
          <Input id="prod-price" type="number" min="0" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prod-stock">Stock qty</Label>
          <Input id="prod-stock" type="number" min="0" step="1" value={stockQty} onChange={e => setStockQty(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prod-low">Low threshold</Label>
          <Input id="prod-low" type="number" min="0" step="1" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Active</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Show in catalog and shipments</p>
        </div>
        <Switch checked={active} onCheckedChange={setActive} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving || !name.trim()}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  );
}
