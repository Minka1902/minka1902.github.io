import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WEEKDAY_LABELS, DEFAULT_SLOT_MINUTES, type WeeklyAvailability, type DayHours } from '@/types';

const SLOT_OPTIONS = [15, 20, 30, 45, 60, 90, 120];
const emptyWeek: WeeklyAvailability = [null, null, null, null, null, null, null];

interface Props {
  initialAvailability?: WeeklyAvailability;
  initialSlotMinutes?: number;
  onSave: (availability: WeeklyAvailability, slotMinutes: number) => Promise<void>;
}

export default function AvailabilityEditor({ initialAvailability, initialSlotMinutes, onSave }: Props) {
  const [days, setDays] = useState<WeeklyAvailability>(
    () => (initialAvailability && initialAvailability.length === 7 ? initialAvailability : emptyWeek),
  );
  const [slotMinutes, setSlotMinutes] = useState(initialSlotMinutes ?? DEFAULT_SLOT_MINUTES);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const setDay = (i: number, hours: DayHours | null) =>
    setDays(prev => prev.map((d, j) => (j === i ? hours : d)));

  const toggleDay = (i: number, open: boolean) =>
    setDay(i, open ? (days[i] ?? { open: '09:00', close: '17:00' }) : null);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onSave(days, slotMinutes);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {WEEKDAY_LABELS.map((label, i) => {
          const hours = days[i];
          return (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <div className="flex w-24 items-center gap-2">
                <Switch checked={!!hours} onCheckedChange={v => toggleDay(i, v)} />
                <span className="text-sm font-medium">{label}</span>
              </div>
              {hours ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    type="time"
                    value={hours.open}
                    onChange={e => setDay(i, { ...hours, open: e.target.value })}
                    className="h-8 w-28"
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    type="time"
                    value={hours.close}
                    onChange={e => setDay(i, { ...hours, close: e.target.value })}
                    className="h-8 w-28"
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Closed</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm">Slot length</Label>
        <Select value={String(slotMinutes)} onValueChange={v => setSlotMinutes(Number(v))}>
          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SLOT_OPTIONS.map(m => <SelectItem key={m} value={String(m)}>{m} min</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save hours'}
        </Button>
        {saved && <span className="text-sm text-green-600 dark:text-green-400">Saved</span>}
      </div>
    </div>
  );
}
