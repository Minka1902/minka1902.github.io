import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomers, usePets, useBusinessStaff } from '@/hooks/useBusiness';
import type { Appointment } from '@/types';

export type AppointmentFormData = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;

interface Props {
  bid: string;
  initial?: Partial<AppointmentFormData>;
  onSubmit: (data: AppointmentFormData) => Promise<void>;
  onCancel: () => void;
}

const NONE = '__none__';

// Convert epoch ms <-> value for <input type="datetime-local"> (local time).
function toLocalInput(ms?: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(ms - off).toISOString().slice(0, 16);
}
function fromLocalInput(value: string): number {
  return new Date(value).getTime();
}

export default function AppointmentForm({ bid, initial, onSubmit, onCancel }: Props) {
  const { customers } = useCustomers(bid);
  const { staff } = useBusinessStaff(bid);
  const [customerId, setCustomerId] = useState(initial?.customerId ?? '');
  const { pets } = usePets(bid, customerId || undefined);
  const [petId, setPetId] = useState(initial?.petId ?? '');
  const [serviceLabel, setServiceLabel] = useState(initial?.serviceLabel ?? '');
  const [start, setStart] = useState(toLocalInput(initial?.startAt));
  const [end, setEnd] = useState(toLocalInput(initial?.endAt));
  const [assignedStaffId, setAssignedStaffId] = useState(initial?.assignedStaffId ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const selectedCustomer = useMemo(() => customers.find(c => c.id === customerId), [customers, customerId]);
  const selectedPet = useMemo(() => pets.find(p => p.id === petId), [pets, petId]);
  const selectedStaff = useMemo(() => staff.find(s => s.userId === assignedStaffId), [staff, assignedStaffId]);

  const valid = customerId && serviceLabel.trim() && start && end;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      await onSubmit({
        customerId,
        customerName: selectedCustomer?.name ?? '',
        petId: petId || undefined,
        petName: selectedPet?.name,
        serviceLabel: serviceLabel.trim(),
        startAt: fromLocalInput(start),
        endAt: fromLocalInput(end),
        assignedStaffId: assignedStaffId || undefined,
        assignedStaffName: selectedStaff?.displayName,
        status: initial?.status ?? 'scheduled',
        notes: notes.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Customer <span className="text-destructive">*</span></Label>
        <Select value={customerId} onValueChange={v => { setCustomerId(v ?? ''); setPetId(''); }}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Select a customer" /></SelectTrigger>
          <SelectContent>
            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Pet</Label>
        <Select value={petId || NONE} onValueChange={v => setPetId(v && v !== NONE ? v : '')} disabled={!customerId}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>None</SelectItem>
            {pets.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="appt-service">Service <span className="text-destructive">*</span></Label>
        <Input id="appt-service" value={serviceLabel} onChange={e => setServiceLabel(e.target.value)} placeholder="e.g. Grooming, Walk" required />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="appt-start">Start <span className="text-destructive">*</span></Label>
          <Input id="appt-start" type="datetime-local" value={start} onChange={e => setStart(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="appt-end">End <span className="text-destructive">*</span></Label>
          <Input id="appt-end" type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Assigned staff</Label>
        <Select value={assignedStaffId || NONE} onValueChange={v => setAssignedStaffId(v && v !== NONE ? v : '')}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Unassigned</SelectItem>
            {staff.map(s => <SelectItem key={s.userId} value={s.userId}>{s.displayName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="appt-notes">Notes</Label>
        <Textarea id="appt-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving || !valid}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  );
}
