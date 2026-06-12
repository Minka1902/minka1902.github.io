import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCustomers, usePets } from '@/hooks/useBusiness';
import { addDays, todayStr } from '@/lib/occupancy';
import type { Stay, StayMedication, StayStatus } from '@/types';

export type StayFormData = Omit<Stay, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'source'>;

interface Props {
  bid: string;
  onSubmit: (data: StayFormData) => Promise<void>;
  onCancel: () => void;
}

const CUSTOM_PET = '__custom__';

export default function StayForm({ bid, onSubmit, onCancel }: Props) {
  const { customers } = useCustomers(bid);
  const [customerId, setCustomerId] = useState('');
  const { pets } = usePets(bid, customerId || undefined);

  const [petId, setPetId] = useState(CUSTOM_PET);
  const [petName, setPetName] = useState('');
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(addDays(todayStr(), 1));
  const [status, setStatus] = useState<StayStatus>('approved');
  const [foodProvidedBy, setFoodProvidedBy] = useState<'owner' | 'business'>('owner');
  const [feedingTimes, setFeedingTimes] = useState('');
  const [foodAmount, setFoodAmount] = useState('');
  const [foodInstructions, setFoodInstructions] = useState('');
  const [medications, setMedications] = useState<StayMedication[]>([]);
  const [careInstructions, setCareInstructions] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedCustomer = customers.find(c => c.id === customerId);
  const selectedPet = pets.find(p => p.id === petId);
  const effectivePetName = petId === CUSTOM_PET ? petName.trim() : (selectedPet?.name ?? '');

  const setMed = (i: number, patch: Partial<StayMedication>) =>
    setMedications(prev => prev.map((m, idx) => idx === i ? { ...m, ...patch } : m));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !effectivePetName || endDate < startDate) return;
    setSaving(true);
    try {
      const times = feedingTimes.split(',').map(t => t.trim()).filter(Boolean);
      await onSubmit({
        customerId,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email,
        customerPhone: selectedCustomer.phone,
        petId: petId !== CUSTOM_PET ? petId : undefined,
        petName: effectivePetName,
        petSpecies: selectedPet?.species,
        startDate,
        endDate,
        status,
        foodPlan: {
          providedBy: foodProvidedBy,
          feedingTimes: times.length ? times : undefined,
          amount: foodAmount.trim() || undefined,
          instructions: foodInstructions.trim() || undefined,
        },
        medications: medications.filter(m => m.name.trim()).map(m => ({
          name: m.name.trim(), dosage: m.dosage?.trim() || undefined, schedule: m.schedule?.trim() || undefined,
        })),
        careInstructions: careInstructions.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Customer</Label>
          <Select value={customerId} onValueChange={v => { setCustomerId(v ?? ''); setPetId(CUSTOM_PET); }}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Pick a customer" /></SelectTrigger>
            <SelectContent>
              {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Pet</Label>
          <Select value={petId} onValueChange={v => setPetId(v ?? CUSTOM_PET)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {pets.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              <SelectItem value={CUSTOM_PET}>Other / type a name…</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {petId === CUSTOM_PET && (
        <div className="space-y-1.5">
          <Label htmlFor="stay-pet">Pet name</Label>
          <Input id="stay-pet" value={petName} onChange={e => setPetName(e.target.value)} required />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="stay-start">Check-in</Label>
          <Input id="stay-start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stay-end">Check-out</Label>
          <Input id="stay-end" type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={v => setStatus(v as StayStatus)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="checked_in">Checked in</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border p-3">
        <Label>Food plan</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select value={foodProvidedBy} onValueChange={v => setFoodProvidedBy(v as 'owner' | 'business')}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Owner brings food</SelectItem>
              <SelectItem value="business">We provide food</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={feedingTimes}
            onChange={e => setFeedingTimes(e.target.value)}
            placeholder="Feeding times, e.g. 08:00, 18:00"
            aria-label="Feeding times"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input value={foodAmount} onChange={e => setFoodAmount(e.target.value)} placeholder="Amount, e.g. 1 cup kibble" aria-label="Food amount" />
          <Input value={foodInstructions} onChange={e => setFoodInstructions(e.target.value)} placeholder="Special instructions" aria-label="Food instructions" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Medications</Label>
        {medications.map((m, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-2">
            <Input className="col-span-4" value={m.name} onChange={e => setMed(i, { name: e.target.value })} placeholder="Name" aria-label={`Medication ${i + 1} name`} />
            <Input className="col-span-3" value={m.dosage ?? ''} onChange={e => setMed(i, { dosage: e.target.value })} placeholder="Dosage" aria-label={`Medication ${i + 1} dosage`} />
            <Input className="col-span-4" value={m.schedule ?? ''} onChange={e => setMed(i, { schedule: e.target.value })} placeholder="Schedule" aria-label={`Medication ${i + 1} schedule`} />
            <button type="button" onClick={() => setMedications(prev => prev.filter((_, idx) => idx !== i))} className="col-span-1 flex justify-center text-muted-foreground hover:text-destructive" aria-label="Remove medication">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setMedications(prev => [...prev, { name: '' }])} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <Plus className="h-4 w-4" /> Add medication
        </button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="stay-care">Care instructions</Label>
        <Textarea id="stay-care" value={careInstructions} onChange={e => setCareInstructions(e.target.value)} rows={2} placeholder="Walks, quirks, fears…" />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving || !selectedCustomer || !effectivePetName}>
          {saving ? 'Saving…' : 'Create stay'}
        </Button>
      </div>
    </form>
  );
}
