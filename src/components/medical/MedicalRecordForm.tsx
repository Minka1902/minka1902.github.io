import { useState } from 'react';
import { useMedical } from '@/hooks/useMedical';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MedicalCategory, MedicalRecord, Vaccination, Medication, Allergy, Diagnosis, Surgery } from '@/types';

interface Props {
  dogId: string;
  category: MedicalCategory;
  onSaved: () => void;
}

export default function MedicalRecordForm({ dogId, category, onSaved }: Props) {
  const { addRecord } = useMedical(dogId, category);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [provider, setProvider] = useState('');
  const [notes, setNotes] = useState('');
  // Category-specific
  const [vaccineName, setVaccineName] = useState('');
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [allergen, setAllergen] = useState('');
  const [condition, setCondition] = useState('');
  const [procedure, setProcedure] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const base = {
      dogId, category, title, date: new Date(date).getTime(),
      nextDueDate: nextDueDate ? new Date(nextDueDate).getTime() : undefined,
      provider: provider || undefined, notes: notes || undefined,
      createdBy: '', createdByName: '', createdAt: 0, updatedAt: 0,
    };

    let record: Omit<MedicalRecord, 'id'>;
    if (category === 'vaccination') {
      record = { ...base, category: 'vaccination', vaccineName } as Omit<Vaccination, 'id'>;
    } else if (category === 'medication') {
      record = { ...base, category: 'medication', medicationName, dosage: dosage || undefined, isActive: true } as Omit<Medication, 'id'>;
    } else if (category === 'allergy') {
      record = { ...base, category: 'allergy', allergen } as Omit<Allergy, 'id'>;
    } else if (category === 'diagnosis') {
      record = { ...base, category: 'diagnosis', condition, isActive: true } as Omit<Diagnosis, 'id'>;
    } else if (category === 'surgery') {
      record = { ...base, category: 'surgery', procedure } as Omit<Surgery, 'id'>;
    } else {
      record = { ...base } as Omit<MedicalRecord, 'id'>;
    }

    await addRecord(record);
    setSubmitting(false);
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
      </div>

      {category === 'vaccination' && (
        <div className="space-y-1">
          <Label htmlFor="vaccineName">Vaccine Name</Label>
          <Input id="vaccineName" value={vaccineName} onChange={e => setVaccineName(e.target.value)} required />
        </div>
      )}
      {category === 'medication' && (
        <>
          <div className="space-y-1">
            <Label htmlFor="medicationName">Medication Name</Label>
            <Input id="medicationName" value={medicationName} onChange={e => setMedicationName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="dosage">Dosage</Label>
            <Input id="dosage" value={dosage} onChange={e => setDosage(e.target.value)} />
          </div>
        </>
      )}
      {category === 'allergy' && (
        <div className="space-y-1">
          <Label htmlFor="allergen">Allergen</Label>
          <Input id="allergen" value={allergen} onChange={e => setAllergen(e.target.value)} required />
        </div>
      )}
      {category === 'diagnosis' && (
        <div className="space-y-1">
          <Label htmlFor="condition">Condition</Label>
          <Input id="condition" value={condition} onChange={e => setCondition(e.target.value)} required />
        </div>
      )}
      {category === 'surgery' && (
        <div className="space-y-1">
          <Label htmlFor="procedure">Procedure</Label>
          <Input id="procedure" value={procedure} onChange={e => setProcedure(e.target.value)} required />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="nextDueDate">Next Due</Label>
          <Input id="nextDueDate" type="date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="provider">Provider</Label>
        <Input id="provider" value={provider} onChange={e => setProvider(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="med-notes">Notes</Label>
        <Input id="med-notes" value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Add Record'}
      </Button>
    </form>
  );
}
