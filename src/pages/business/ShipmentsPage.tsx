import { useState } from 'react';
import { Plus, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBusiness, useShipments } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import ShipmentCard from '@/components/business/ShipmentCard';
import ShipmentForm, { type ShipmentFormData } from '@/components/business/ShipmentForm';
import type { ShipmentStatus } from '@/types';

export default function ShipmentsPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const { shipments, loading, createShipment, updateShipment, deleteShipment } = useShipments(bid);

  const [addOpen, setAddOpen] = useState(false);

  const canView = can('view_shipments');
  const canManage = can('manage_shipments');

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canView && !canManage) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to shipments.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Shipments</h1>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New shipment
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : shipments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Truck className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No shipments</p>
            <p className="mt-1 text-sm text-muted-foreground">Create your first shipment.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {shipments.map(s => (
            <ShipmentCard
              key={s.id}
              shipment={s}
              canManage={canManage}
              onStatusChange={(status: ShipmentStatus) => updateShipment(s.id, { status })}
              onDelete={() => { if (confirm('Delete this shipment?')) deleteShipment(s.id); }}
            />
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New shipment</DialogTitle></DialogHeader>
          <ShipmentForm
            bid={bid}
            onSubmit={async (data: ShipmentFormData) => { await createShipment(data); setAddOpen(false); }}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
