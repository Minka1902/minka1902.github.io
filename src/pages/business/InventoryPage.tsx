import { useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBusiness, useProducts } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import ProductCard from '@/components/business/ProductCard';
import ProductForm, { type ProductFormData } from '@/components/business/ProductForm';
import type { Product } from '@/types';

export default function InventoryPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const currency = activeBusiness?.currency ?? 'USD';
  const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts(bid);

  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const canView = can('view_inventory');
  const canManage = can('manage_inventory');

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canView && !canManage) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to inventory.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Inventory</h1>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add product
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No products</p>
            <p className="mt-1 text-sm text-muted-foreground">Add your first product to track stock.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              currency={currency}
              canManage={canManage}
              onEdit={() => setEditProduct(p)}
              onDelete={() => { if (confirm(`Delete ${p.name}?`)) deleteProduct(p.id); }}
            />
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add product</DialogTitle></DialogHeader>
          <ProductForm
            onSubmit={async (data: ProductFormData) => { await createProduct(data); setAddOpen(false); }}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editProduct} onOpenChange={o => { if (!o) setEditProduct(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit product</DialogTitle></DialogHeader>
          {editProduct && (
            <ProductForm
              initial={editProduct}
              onSubmit={async (data: ProductFormData) => { await updateProduct(editProduct.id, data); setEditProduct(null); }}
              onCancel={() => setEditProduct(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
