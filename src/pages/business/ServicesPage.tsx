import { useState } from 'react';
import { Clock, Pencil, Plus, Scissors, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBusiness, useServices } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import type { BusinessService } from '@/types';

interface ServiceFormProps {
  initial?: BusinessService;
  onSubmit: (data: Omit<BusinessService, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

function ServiceForm({ initial, onSubmit, onCancel }: ServiceFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : '');
  const [duration, setDuration] = useState(initial?.durationMinutes != null ? String(initial.durationMinutes) : '');
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        price: Number(price) || 0,
        durationMinutes: duration !== '' ? Math.max(0, Math.floor(Number(duration))) || undefined : undefined,
        active,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="svc-name">Name <span className="text-destructive">*</span></Label>
        <Input id="svc-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Full groom" required />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="svc-price">Price</Label>
          <Input id="svc-price" type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="svc-duration">Duration (minutes)</Label>
          <Input id="svc-duration" type="number" min="0" step="5" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Optional" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="svc-desc">Description</Label>
        <Textarea id="svc-desc" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={active} onCheckedChange={setActive} />
        Active (shown to customers)
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  );
}

export default function ServicesPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const currency = activeBusiness?.currency ?? 'USD';
  const { services, loading, createService, updateService, deleteService } = useServices(bid);

  const [addOpen, setAddOpen] = useState(false);
  const [editService, setEditService] = useState<BusinessService | null>(null);

  const canView = can('view_services');
  const canManage = can('manage_services');

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canView && !canManage) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to services.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Services &amp; prices</h1>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add service
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Scissors className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No services</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Define your menu once — appointments, invoices and the booking page pick from it.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map(s => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="truncate">{s.name}</span>
                    {!s.active && <Badge variant="outline">Hidden</Badge>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>{s.price.toFixed(2)} {currency}</span>
                    {s.durationMinutes != null && (
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{s.durationMinutes} min</span>
                    )}
                    {s.description && <span className="truncate">{s.description}</span>}
                  </div>
                </div>
                {canManage && (
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditService(s)} aria-label={`Edit ${s.name}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm(`Delete ${s.name}?`)) void deleteService(s.id); }} aria-label={`Delete ${s.name}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add service</DialogTitle></DialogHeader>
          <ServiceForm
            onSubmit={async data => { await createService(data); setAddOpen(false); }}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editService} onOpenChange={o => { if (!o) setEditService(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit service</DialogTitle></DialogHeader>
          {editService && (
            <ServiceForm
              initial={editService}
              onSubmit={async data => { await updateService(editService.id, data); setEditService(null); }}
              onCancel={() => setEditService(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
