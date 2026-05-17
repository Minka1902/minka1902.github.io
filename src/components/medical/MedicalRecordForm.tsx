import { useState } from 'react';
import { useMedical } from '@/hooks/useMedical';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MedicalCategory, MedicalRecord, Vaccination, Medication, Allergy, Diagnosis, Surgery } from '@/types';

function tsToDateInput(ts: number | undefined): string {
  if (!ts) return '';
  return new Date(ts).toISOString().split('T')[0];
}

interface Props {
  dogId: string;
  category: MedicalCategory;
  onSaved: () => void;
  record?: MedicalRecord; // when provided → edit mode
}

export default function MedicalRecordForm({ dogId, category, onSaved, record }: Props) {
  const { addRecord, updateRecord } = useMedical(dogId, category);
  const isEdit = !!record;

  const [title,          setTitle]          = useState(record?.title ?? '');
  const [date,           setDate]           = useState(tsToDateInput(record?.date));
  const [nextDueDate,    setNextDueDate]    = useState(tsToDateInput(record?.nextDueDate));
  const [provider,       setProvider]       = useState(record?.provider ?? '');
  const [notes,          setNotes]          = useState(record?.notes ?? '');

  // Category-specific fields seeded from existing record
  const [vaccineName,    setVaccineName]    = useState((record as Vaccination)?.vaccineName ?? '');
  const [medicationName, setMedicationName] = useState((record as Medication)?.medicationName ?? '');
  const [dosage,         setDosage]         = useState((record as Medication)?.dosage ?? '');
  const [allergen,       setAllergen]       = useState((record as Allergy)?.allergen ?? '');
  const [condition,      setCondition]      = useState((record as Diagnosis)?.condition ?? '');
  const [procedure,      setProcedure]      = useState((record as Surgery)?.procedure ?? '');

  const [isActive,        setIsActive]        = useState((record as Medication)?.isActive ?? true);
  const [administrationTimes, setAdministrationTimes] = useState<string[]>((record as Medication)?.administrationTimes ?? []);

  const [submitting, setSubmitting] = useState(false);
  const [dateError, setDateError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDateError('');

    // Date must be today or earlier — the event must have already happened
    const recordDate = new Date(date).getTime();
    if (recordDate > Date.now()) {
      setDateError('The record date cannot be in the future — this event must have already happened.');
      return;
    }

    setSubmitting(true);

    const base = {
      title,
      date: new Date(date).getTime(),
      nextDueDate: nextDueDate ? new Date(nextDueDate).getTime() : undefined,
      provider: provider || undefined,
      notes: notes || undefined,
    };

    if (isEdit) {
      const extra: Partial<MedicalRecord> = {};
      if (category === 'vaccination') (extra as Partial<Vaccination>).vaccineName = vaccineName;
      if (category === 'medication')  { (extra as Partial<Medication>).medicationName = medicationName; (extra as Partial<Medication>).dosage = dosage || undefined; (extra as Partial<Medication>).isActive = isActive; (extra as Partial<Medication>).administrationTimes = administrationTimes.length ? administrationTimes : undefined; }
      if (category === 'allergy')     (extra as Partial<Allergy>).allergen = allergen;
      if (category === 'diagnosis')   (extra as Partial<Diagnosis>).condition = condition;
      if (category === 'surgery')     (extra as Partial<Surgery>).procedure = procedure;
      await updateRecord(record.id, { ...base, ...extra });
    } else {
      const fullBase = {
        dogId, category, ...base,
        createdBy: '', createdByName: '', createdAt: 0, updatedAt: 0,
      };
      let newRecord: Omit<MedicalRecord, 'id'>;
      if (category === 'vaccination') {
        newRecord = { ...fullBase, category: 'vaccination', vaccineName } as Omit<Vaccination, 'id'>;
      } else if (category === 'medication') {
        newRecord = { ...fullBase, category: 'medication', medicationName, dosage: dosage || undefined, isActive, administrationTimes: administrationTimes.length ? administrationTimes : undefined } as Omit<Medication, 'id'>;
      } else if (category === 'allergy') {
        newRecord = { ...fullBase, category: 'allergy', allergen } as Omit<Allergy, 'id'>;
      } else if (category === 'diagnosis') {
        newRecord = { ...fullBase, category: 'diagnosis', condition, isActive: true } as Omit<Diagnosis, 'id'>;
      } else if (category === 'surgery') {
        newRecord = { ...fullBase, category: 'surgery', procedure } as Omit<Surgery, 'id'>;
      } else {
        newRecord = { ...fullBase } as Omit<MedicalRecord, 'id'>;
      }
      await addRecord(newRecord);
    }

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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Daily Administration Times</Label>
              <p className="text-xs text-muted-foreground">Show on timeline</p>
            </div>
            {administrationTimes.map((t, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="time"
                  value={t}
                  onChange={e => setAdministrationTimes(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                  className="flex-1 text-sm border border-input rounded-lg px-2 py-1.5 bg-background outline-none focus:border-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setAdministrationTimes(prev => prev.filter((_, j) => j !== i))}
                  className="text-muted-foreground hover:text-destructive transition-colors text-sm px-2"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAdministrationTimes(prev => [...prev, '08:00'])}
              className="text-xs text-primary hover:underline underline-offset-2"
            >
              + Add time
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="isActive">Currently active</Label>
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
          <Input
            id="date"
            type="date"
            value={date}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => { setDate(e.target.value); setDateError(''); }}
            required
            className={dateError ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {dateError && (
            <p className="text-xs text-destructive mt-1">{dateError}</p>
          )}
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
        {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add Record'}
      </Button>
    </form>
  );
}
