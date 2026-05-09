import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useDogActions } from '@/hooks/useDog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import BreedAutocomplete from './BreedAutocomplete';
import type { Dog, FeedingEntry } from '@/types';

type DogFormFields = Omit<Dog, 'id' | 'createdAt' | 'updatedAt' | 'mainHumanId'>;

interface Props {
  initial?: Partial<DogFormFields>;
  dogId?: string;
  onSaved?: () => void;
}

export default function DogProfileForm({ initial, dogId, onSaved }: Props) {
  const { createDog, updateDog } = useDogActions();
  const navigate = useNavigate();
  const [name, setName] = useState(initial?.name ?? '');
  const [breed, setBreed] = useState(initial?.breed ?? '');
  const [sex, setSex] = useState<Dog['sex']>(initial?.sex ?? 'unknown');
  const [isMix, setIsMix] = useState(initial?.isMix ?? false);
  const [weightKg, setWeightKg] = useState(initial?.weightKg?.toString() ?? '');
  const [chipId, setChipId] = useState(initial?.chipId ?? '');
  const [foodType, setFoodType] = useState(initial?.foodType ?? '');
  const [feedings, setFeedings] = useState<FeedingEntry[]>(initial?.feedings ?? []);
  const [behaviorNotes, setBehaviorNotes] = useState(initial?.behaviorNotes ?? '');
  const [rescueOrg, setRescueOrg] = useState(initial?.rescueOrg ?? '');
  const [emergencyContact, setEmergencyContact] = useState(initial?.emergencyContact ?? '');
  const [homeAddress, setHomeAddress] = useState(initial?.homeAddress ?? '');
  const [submitting, setSubmitting] = useState(false);

  const defaultQrVisibility = {
    showAddress: false, showPhone: false, showRescueOrg: false, showMedicalAlerts: false,
  };

  const addFeeding = () => setFeedings(prev => [...prev, { time: '', amount: '' }]);
  const removeFeeding = (i: number) => setFeedings(prev => prev.filter((_, idx) => idx !== i));
  const updateFeeding = (i: number, field: keyof FeedingEntry, value: string) =>
    setFeedings(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const data: DogFormFields = {
      name, breed: breed || undefined, sex, isMix,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      chipId: chipId || undefined,
      foodType: foodType || undefined,
      feedings: feedings.filter(f => f.time).length > 0 ? feedings.filter(f => f.time) : undefined,
      behaviorNotes: behaviorNotes || undefined,
      rescueOrg: rescueOrg || undefined,
      emergencyContact: emergencyContact || undefined,
      homeAddress: homeAddress || undefined,
      qrPublic: initial?.qrPublic ?? false,
      qrVisibility: initial?.qrVisibility ?? defaultQrVisibility,
    };
    if (dogId) {
      await updateDog(dogId, data);
    } else {
      await createDog(data);
    }
    setSubmitting(false);
    if (onSaved) onSaved();
    else navigate('/');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Basic Info</p>
        <div className="space-y-1.5">
          <Label htmlFor="dog-name">Name <span className="text-destructive">*</span></Label>
          <Input id="dog-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rex" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="breed">Breed</Label>
          <BreedAutocomplete id="breed" value={breed} onChange={setBreed} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Sex</Label>
            <Select value={sex} onValueChange={v => setSex(v as Dog['sex'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input id="weight" type="number" step="0.1" min="0" value={weightKg} onChange={e => setWeightKg(e.target.value)} placeholder="e.g. 28.5" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Mixed breed</p>
            <p className="text-xs text-muted-foreground mt-0.5">Check if this dog is a mix</p>
          </div>
          <Switch checked={isMix} onCheckedChange={setIsMix} />
        </div>
      </div>

      <Separator />

      {/* Identity */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Identity</p>
        <div className="space-y-1.5">
          <Label htmlFor="chipId">Microchip ID</Label>
          <Input id="chipId" value={chipId} onChange={e => setChipId(e.target.value)} placeholder="15-digit chip number" />
        </div>
      </div>

      <Separator />

      {/* Feeding */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Feeding</p>
        <div className="space-y-1.5">
          <Label htmlFor="foodType">Food Type</Label>
          <Input id="foodType" value={foodType} onChange={e => setFoodType(e.target.value)} placeholder="e.g. Royal Canin Adult, raw, homemade…" />
        </div>
        {feedings.length > 0 && (
          <div className="space-y-2">
            <Label>Feeding Schedule</Label>
            {feedings.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="time"
                  value={f.time}
                  onChange={e => updateFeeding(i, 'time', e.target.value)}
                  className="w-32 shrink-0"
                  aria-label={`Feeding ${i + 1} time`}
                />
                <Input
                  value={f.amount}
                  onChange={e => updateFeeding(i, 'amount', e.target.value)}
                  placeholder="e.g. 200g, 1 cup"
                  aria-label={`Feeding ${i + 1} amount`}
                />
                <button
                  type="button"
                  onClick={() => removeFeeding(i)}
                  className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Remove feeding">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={addFeeding}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Plus className="h-4 w-4" />
          Add feeding time
        </button>
      </div>

      <Separator />

      {/* Contact & Organization */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contact & Organization</p>
        <div className="space-y-1.5">
          <Label htmlFor="rescueOrg">Rescue Organization</Label>
          <Input id="rescueOrg" value={rescueOrg} onChange={e => setRescueOrg(e.target.value)} placeholder="e.g. Happy Paws Rescue" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="emergencyContact">Emergency Contact</Label>
          <Input id="emergencyContact" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} placeholder="Name and phone number" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="homeAddress">Home Address</Label>
          <Input id="homeAddress" value={homeAddress} onChange={e => setHomeAddress(e.target.value)} placeholder="Street address" />
        </div>
      </div>

      <Separator />

      {/* Notes */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Notes</p>
        <div className="space-y-1.5">
          <Label htmlFor="behaviorNotes">Behavior Notes</Label>
          <textarea
            id="behaviorNotes"
            value={behaviorNotes}
            onChange={e => setBehaviorNotes(e.target.value)}
            rows={4}
            placeholder="Temperament, triggers, training progress…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : dogId ? 'Save Changes' : 'Add Dog'}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
