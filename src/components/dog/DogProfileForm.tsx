import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDogActions } from '@/hooks/useDog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BreedAutocomplete from './BreedAutocomplete';
import type { Dog } from '@/types';

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
  const [behaviorNotes, setBehaviorNotes] = useState(initial?.behaviorNotes ?? '');
  const [rescueOrg, setRescueOrg] = useState(initial?.rescueOrg ?? '');
  const [emergencyContact, setEmergencyContact] = useState(initial?.emergencyContact ?? '');
  const [homeAddress, setHomeAddress] = useState(initial?.homeAddress ?? '');
  const [submitting, setSubmitting] = useState(false);

  const defaultQrVisibility = {
    showAddress: false, showPhone: false, showRescueOrg: false, showMedicalAlerts: false,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const data: DogFormFields = {
      name, breed: breed || undefined, sex, isMix,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      chipId: chipId || undefined,
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
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="space-y-1">
        <Label htmlFor="dog-name">Dog's Name</Label>
        <Input id="dog-name" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="breed">Breed</Label>
        <BreedAutocomplete id="breed" value={breed} onChange={setBreed} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
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
        <div className="space-y-1">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input id="weight" type="number" step="0.1" value={weightKg} onChange={e => setWeightKg(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input id="isMix" type="checkbox" checked={isMix} onChange={e => setIsMix(e.target.checked)} className="h-4 w-4" />
        <Label htmlFor="isMix">Mixed breed</Label>
      </div>
      <div className="space-y-1">
        <Label htmlFor="chipId">Microchip ID</Label>
        <Input id="chipId" value={chipId} onChange={e => setChipId(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="rescueOrg">Rescue Organization</Label>
        <Input id="rescueOrg" value={rescueOrg} onChange={e => setRescueOrg(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="emergencyContact">Emergency Contact</Label>
        <Input id="emergencyContact" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="homeAddress">Home Address</Label>
        <Input id="homeAddress" value={homeAddress} onChange={e => setHomeAddress(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="behaviorNotes">Behavior Notes</Label>
        <textarea
          id="behaviorNotes"
          value={behaviorNotes}
          onChange={e => setBehaviorNotes(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save Dog'}
      </Button>
    </form>
  );
}
