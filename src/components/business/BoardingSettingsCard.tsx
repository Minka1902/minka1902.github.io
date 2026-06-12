import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Business, BoardingSettings } from '@/types';

interface Props {
  business: Business;
  onSave: (boarding: BoardingSettings) => Promise<void>;
}

// The owner's boarding answers: how many spaces are there, can customers
// request stays online, and what does a night cost. Capacity drives the
// overbooking guard and the public "full dates" calendar.
export default function BoardingSettingsCard({ business, onSave }: Props) {
  const initial = business.boarding;
  const [capacity, setCapacity] = useState(initial?.capacity != null ? String(initial.capacity) : '');
  const [requestsOpen, setRequestsOpen] = useState(initial?.requestsOpen ?? false);
  const [pricePerNight, setPricePerNight] = useState(initial?.pricePerNight != null ? String(initial.pricePerNight) : '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave({
        capacity: Math.max(0, Math.floor(Number(capacity) || 0)),
        requestsOpen,
        pricePerNight: pricePerNight !== '' ? Number(pricePerNight) : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Boarding &amp; daycare</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="boarding-capacity">Spaces / kennels</Label>
            <Input
              id="boarding-capacity"
              type="number"
              min="0"
              step="1"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">The app blocks approvals past this number.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="boarding-price">Price per night ({business.currency})</Label>
            <Input
              id="boarding-price"
              type="number"
              min="0"
              step="0.01"
              value={pricePerNight}
              onChange={e => setPricePerNight(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="pr-4">
            <p className="text-sm font-medium">Accept stay requests online</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Pet parents request a stay from the directory; you approve each one.
            </p>
          </div>
          <Switch checked={requestsOpen} onCheckedChange={setRequestsOpen} />
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
