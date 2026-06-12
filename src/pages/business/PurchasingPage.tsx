import { useState } from 'react';
import { Building2, PackagePlus, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBusiness, useProducts, usePurchaseOrders, useSuppliers } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import type { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '@/types';

const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: 'Draft', ordered: 'Ordered', received: 'Received', cancelled: 'Cancelled',
};

interface POFormProps {
  bid: string;
  onSubmit: (data: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'total'>) => Promise<void>;
  onCancel: () => void;
}

function PurchaseOrderForm({ bid, onSubmit, onCancel }: POFormProps) {
  const { suppliers } = useSuppliers(bid);
  const { products } = useProducts(bid);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [expectedAt, setExpectedAt] = useState('');
  const [saving, setSaving] = useState(false);

  const supplier = suppliers.find(s => s.id === supplierId);

  const addItem = () => {
    const first = products[0];
    if (!first) return;
    setItems(prev => [...prev, { productId: first.id, name: first.name, quantity: 1, unitCost: 0 }]);
  };
  const setItem = (i: number, patch: Partial<PurchaseOrderItem>) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier || items.length === 0) return;
    setSaving(true);
    try {
      await onSubmit({
        supplierId,
        supplierName: supplier.name,
        items,
        status: 'ordered',
        expectedAt: expectedAt ? new Date(`${expectedAt}T12:00:00`).getTime() : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Supplier</Label>
          <Select value={supplierId} onValueChange={v => setSupplierId(v ?? '')}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Pick a supplier" /></SelectTrigger>
            <SelectContent>
              {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="po-expected">Expected delivery</Label>
          <Input id="po-expected" type="date" value={expectedAt} onChange={e => setExpectedAt(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Items</Label>
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-2">
            <div className="col-span-5">
              <Select value={it.productId} onValueChange={v => {
                const p = products.find(pr => pr.id === v);
                if (p) setItem(i, { productId: p.id, name: p.name });
              }}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Product" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Input className="col-span-3" type="number" min="1" step="1" value={it.quantity}
              onChange={e => setItem(i, { quantity: Math.max(1, Number(e.target.value)) })} aria-label={`Item ${i + 1} quantity`} />
            <Input className="col-span-3" type="number" min="0" step="0.01" value={it.unitCost}
              onChange={e => setItem(i, { unitCost: Math.max(0, Number(e.target.value)) })} aria-label={`Item ${i + 1} unit cost`} />
            <button type="button" onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))} className="col-span-1 flex justify-center text-muted-foreground hover:text-destructive" aria-label="Remove item">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" disabled={products.length === 0}>
          <Plus className="h-4 w-4" /> Add item (qty · unit cost)
        </button>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving || !supplier || items.length === 0}>
          {saving ? 'Saving…' : 'Create purchase order'}
        </Button>
      </div>
    </form>
  );
}

export default function PurchasingPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const currency = activeBusiness?.currency ?? 'USD';
  const { purchaseOrders, loading, createPurchaseOrder, updatePurchaseOrder, receivePurchaseOrder, deletePurchaseOrder } = usePurchaseOrders(bid);
  const { suppliers, createSupplier, deleteSupplier } = useSuppliers(bid);

  const [addOpen, setAddOpen] = useState(false);
  const [suppliersOpen, setSuppliersOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');

  const canView = can('view_purchasing');
  const canManage = can('manage_purchasing');

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canView && !canManage) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to purchasing.</div>;
  }

  const addSupplier = async () => {
    if (!supplierName.trim()) return;
    await createSupplier({ name: supplierName.trim(), email: supplierEmail.trim() || undefined });
    setSupplierName('');
    setSupplierEmail('');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Purchasing</h1>
        {canManage && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setSuppliersOpen(true)}>
              <Building2 className="h-3.5 w-3.5" /> Suppliers
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> New PO
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : purchaseOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <PackagePlus className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No purchase orders</p>
            <p className="mt-1 text-sm text-muted-foreground">Order from a supplier — receiving adds the goods to stock.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {purchaseOrders.map(po => (
            <Card key={po.id}>
              <CardContent className="space-y-2 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{po.supplierName}</span>
                      <Badge variant={po.status === 'received' ? 'secondary' : po.status === 'cancelled' ? 'destructive' : 'outline'}>
                        {STATUS_LABELS[po.status]}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {po.items.reduce((s, i) => s + i.quantity, 0)} items · {po.total.toFixed(2)} {currency}
                      {po.expectedAt && po.status === 'ordered' && ` · expected ${new Date(po.expectedAt).toLocaleDateString()}`}
                      {po.receivedAt && ` · received ${new Date(po.receivedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  {canManage && (
                    <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm('Delete this purchase order?')) void deletePurchaseOrder(po.id); }} aria-label="Delete purchase order">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  {po.items.map((it, i) => <li key={i}>{it.quantity} × {it.name} @ {it.unitCost.toFixed(2)}</li>)}
                </ul>
                {canManage && po.status === 'ordered' && (
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={() => void receivePurchaseOrder(po)}>Receive into stock</Button>
                    <Button size="sm" variant="outline" onClick={() => void updatePurchaseOrder(po.id, { status: 'cancelled' })}>Cancel</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New purchase order</DialogTitle></DialogHeader>
          <PurchaseOrderForm
            bid={bid}
            onSubmit={async data => { await createPurchaseOrder(data); setAddOpen(false); }}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={suppliersOpen} onOpenChange={setSuppliersOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Suppliers</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {suppliers.map(s => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{s.name}</p>
                  {s.email && <p className="text-xs text-muted-foreground">{s.email}</p>}
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm(`Delete ${s.name}?`)) void deleteSupplier(s.id); }} aria-label={`Delete ${s.name}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <div className="space-y-2 rounded-lg border border-dashed p-3">
              <Input value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="Supplier name" aria-label="Supplier name" />
              <Input value={supplierEmail} onChange={e => setSupplierEmail(e.target.value)} placeholder="Email (optional)" aria-label="Supplier email" />
              <Button size="sm" onClick={addSupplier} disabled={!supplierName.trim()}>Add supplier</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
