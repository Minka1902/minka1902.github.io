import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BusinessPet } from '@/types';

export type PetFormData = Omit<BusinessPet, 'id' | 'createdAt' | 'updatedAt'>;

interface Props {
  customerId: string;
  initial?: Partial<PetFormData>;
  onSubmit: (data: PetFormData) => Promise<void>;
  onCancel: () => void;
}

export default function PetForm({ customerId, initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [species, setSpecies] = useState<BusinessPet['species']>(initial?.species ?? 'dog');
  const [breed, setBreed] = useState(initial?.breed ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        customerId,
        name: name.trim(),
        species,
        breed: breed.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pet-name">Name <span className="text-destructive">*</span></Label>
          <Input id="pet-name" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Species</Label>
          <Select value={species} onValueChange={v => setSpecies(v as BusinessPet['species'])}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dog">Dog</SelectItem>
              <SelectItem value="cat">Cat</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pet-breed">Breed</Label>
        <Input id="pet-breed" value={breed} onChange={e => setBreed(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pet-notes">Notes</Label>
        <Textarea id="pet-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving || !name.trim()}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  );
}
