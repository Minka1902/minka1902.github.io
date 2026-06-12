import { useState } from 'react';
import { AlertTriangle, Package, PackagePlus, Plus, ShoppingCart, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBusiness, useOrders, useProducts, usePurchaseOrders, useShipments } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import ProductCard from '@/components/business/ProductCard';
import ProductForm, { type ProductFormData } from '@/components/business/ProductForm';
import OrderCard from '@/components/business/OrderCard';
import ShipmentCard from '@/components/business/ShipmentCard';
import { isLowStock } from '@/components/business/StockBadge';
import { isModuleEnabled, type Product, type ShipmentStatus } from '@/types';

// The Stock Hub: everything stock-related on one page — current levels with
// low-stock warnings, customer orders waiting on fulfilment, and outgoing
// deliveries. (Incoming supplier orders join once purchasing data exists.)
export default function InventoryPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const currency = activeBusiness?.currency ?? 'USD';
  const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts(bid);

  const showOrders = isModuleEnabled(activeBusiness, 'orders') && (can('view_orders') || can('manage_orders'));
  const showShipments = isModuleEnabled(activeBusiness, 'shipments') && (can('view_shipments') || can('manage_shipments'));
  const {
    orders, loading: ordersLoading, acceptOrder, closeOrder, updateOrderStatus,
    setOrderPaid, createInvoiceFromOrder, createShipmentFromOrder, deleteOrder,
  } = useOrders(showOrders ? bid : '');
  const { shipments, loading: shipmentsLoading, updateShipment, deleteShipment } = useShipments(showShipments ? bid : '');
  const showPurchasing = isModuleEnabled(activeBusiness, 'purchasing') && (can('view_purchasing') || can('manage_purchasing'));
  const { purchaseOrders, loading: poLoading, receivePurchaseOrder } = usePurchaseOrders(showPurchasing ? bid : '');

  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const canView = can('view_inventory');
  const canManage = can('manage_inventory');
  const canManageOrders = can('manage_orders');

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canView && !canManage) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to inventory.</div>;
  }

  // Low-stock items pinned on top of the stock list.
  const lowStock = products.filter(isLowStock);
  const sorted = [...lowStock, ...products.filter(p => !isLowStock(p))];

  const openOrders = orders.filter(o => !['completed', 'cancelled', 'rejected'].includes(o.status));
  const activeShipments = shipments.filter(s => !['delivered', 'returned'].includes(s.status));
  const incomingPOs = purchaseOrders.filter(po => po.status === 'ordered');

  const emptyState = (icon: React.ReactNode, title: string, hint: string) => (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">{icon}</div>
      <div className="text-center">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Stock</h1>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add product
          </Button>
        )}
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {lowStock.length} product{lowStock.length !== 1 ? 's' : ''} at or below the low-stock threshold.
        </div>
      )}

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          {showPurchasing && <TabsTrigger value="incoming">Incoming{incomingPOs.length ? ` (${incomingPOs.length})` : ''}</TabsTrigger>}
          {showOrders && <TabsTrigger value="fulfil">To fulfil{openOrders.length ? ` (${openOrders.length})` : ''}</TabsTrigger>}
          {showShipments && <TabsTrigger value="outgoing">Outgoing{activeShipments.length ? ` (${activeShipments.length})` : ''}</TabsTrigger>}
        </TabsList>

        <TabsContent value="stock">
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : sorted.length === 0 ? (
            emptyState(<Package className="h-6 w-6 text-muted-foreground" />, 'No products', 'Add your first product to track stock.')
          ) : (
            <div className="space-y-2">
              {sorted.map(p => (
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
        </TabsContent>

        {showPurchasing && (
          <TabsContent value="incoming">
            {poLoading ? (
              <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : incomingPOs.length === 0 ? (
              emptyState(<PackagePlus className="h-6 w-6 text-muted-foreground" />, 'No incoming deliveries', 'Ordered supplier deliveries show up here.')
            ) : (
              <div className="space-y-2">
                {incomingPOs.map(po => (
                  <div key={po.id} className="space-y-2 rounded-xl border bg-card p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium">{po.supplierName}</p>
                      <p className="text-xs text-muted-foreground">
                        {po.expectedAt ? `expected ${new Date(po.expectedAt).toLocaleDateString()}` : 'no ETA'}
                      </p>
                    </div>
                    <ul className="space-y-0.5 text-xs text-muted-foreground">
                      {po.items.map((it, i) => <li key={i}>{it.quantity} × {it.name}</li>)}
                    </ul>
                    {can('manage_purchasing') && (
                      <Button size="sm" onClick={() => void receivePurchaseOrder(po)}>Receive into stock</Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {showOrders && (
          <TabsContent value="fulfil">
            {ordersLoading ? (
              <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
            ) : openOrders.length === 0 ? (
              emptyState(<ShoppingCart className="h-6 w-6 text-muted-foreground" />, 'Nothing to fulfil', 'Open customer orders show up here.')
            ) : (
              <div className="space-y-2">
                {openOrders.map(o => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    currency={currency}
                    canManage={canManageOrders}
                    onAccept={() => acceptOrder(o)}
                    onClose={(status) => { if (confirm(`${status === 'rejected' ? 'Reject' : 'Cancel'} this order?`)) void closeOrder(o, status); }}
                    onAdvance={(status) => updateOrderStatus(o.id, status)}
                    onMarkPaid={() => setOrderPaid(o.id, 'paid')}
                    onCreateInvoice={() => void createInvoiceFromOrder(o)}
                    onCreateShipment={() => void createShipmentFromOrder(o)}
                    onDelete={() => { if (confirm('Delete this order?')) void deleteOrder(o.id); }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {showShipments && (
          <TabsContent value="outgoing">
            {shipmentsLoading ? (
              <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
            ) : activeShipments.length === 0 ? (
              emptyState(<Truck className="h-6 w-6 text-muted-foreground" />, 'No outgoing deliveries', 'Undelivered shipments show up here.')
            ) : (
              <div className="space-y-2">
                {activeShipments.map(s => (
                  <ShipmentCard
                    key={s.id}
                    shipment={s}
                    canManage={can('manage_shipments')}
                    onStatusChange={(status: ShipmentStatus) => updateShipment(s.id, { status })}
                    onDelete={() => { if (confirm('Delete this shipment?')) deleteShipment(s.id); }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

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
