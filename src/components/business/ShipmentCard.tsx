import { Package, Trash2, Truck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ShipmentStatusStepper from './ShipmentStatusStepper';
import type { Shipment, ShipmentStatus } from '@/types';

const STATUSES: { value: ShipmentStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
  { value: 'returned', label: 'Returned' },
];

interface Props {
  shipment: Shipment;
  canManage: boolean;
  onStatusChange: (status: ShipmentStatus) => void;
  onDelete: () => void;
}

export default function ShipmentCard({ shipment, canManage, onStatusChange, onDelete }: Props) {
  const itemCount = shipment.items.reduce((s, it) => s + it.quantity, 0);
  return (
    <Card>
      <CardContent className="space-y-3 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              {shipment.customerName && <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{shipment.customerName}</span>}
              {shipment.carrier && <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3" />{shipment.carrier}</span>}
              {shipment.trackingNumber && <span>#{shipment.trackingNumber}</span>}
            </div>
          </div>
          {canManage && (
            <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Delete shipment"><Trash2 className="h-3.5 w-3.5" /></Button>
          )}
        </div>

        <ShipmentStatusStepper status={shipment.status} />

        {canManage && (
          <Select value={shipment.status} onValueChange={v => onStatusChange(v as ShipmentStatus)}>
            <SelectTrigger size="sm" className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  );
}
