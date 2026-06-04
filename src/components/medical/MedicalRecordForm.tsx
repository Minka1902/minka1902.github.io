import { useState } from 'react';
import { useMedical } from '@/hooks/useMedical';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MedicalCategory, MedicalRecord, Vaccination, Medication, Allergy, Diagnosis, Surgery } from '@/types';

type RepeatInterval = 'none' | '91' | '182' | '365' | '730' | '1095' | 'custom';
type CustomRepeatUnit = 'weeks' | 'months' | 'years';

const REPEAT_OPTIONS: { value: RepeatInterval; label: string }[] = [
  { value: 'none',  label: 'None (no repeat)' },
  { value: '91',    label: 'Every 3 months' },
  { value: '182',   label: 'Every 6 months' },
  { value: '365',   label: 'Every year' },
  { value: '730',   label: 'Every 2 years' },
  { value: '1095',  label: 'Every 3 years' },
  { value: 'custom', label: 'Custom interval' },
];

const PRESET_DAYS = [91, 182, 365, 730, 1095] as const;

/** Detect which repeat preset (if any) matches a day diff. Tolerance ±3 days. */
function detectRepeatInterval(datMs: number, nextMs: number): { interval: RepeatInterval; customValue: number; customUnit: CustomRepeatUnit } {
  const diffDays = Math.round((nextMs - datMs) / 86_400_000);
  for (const preset of PRESET_DAYS) {
    if (Math.abs(diffDays - preset) <= 3) {
      return { interval: String(preset) as RepeatInterval, customValue: 1, customUnit: 'weeks' };
    }
  }
  // No preset match — fall back to custom in weeks
  return { interval: 'custom', customValue: Math.round(diffDays / 7), customUnit: 'weeks' };
}

/** Compute nextDueDate timestamp from date string + repeat state. Returns undefined when interval is 'none'. */
function computeNextDueDate(
  dateStr: string,
  repeatInterval: RepeatInterval,
  customRepeatValue: number,
  customRepeatUnit: CustomRepeatUnit,
): number | undefined {
  if (repeatInterval === 'none' || !dateStr) return undefined;
  const dateMs = new Date(dateStr).getTime();
  if (repeatInterval === 'custom') {
    const multipliers: Record<CustomRepeatUnit, number> = {
      weeks:  7 * 86_400_000,
      months: 30.44 * 86_400_000,
      years:  365.25 * 86_400_000,
    };
    return Math.round(dateMs + customRepeatValue * multipliers[customRepeatUnit]);
  }
  return dateMs + parseInt(repeatInterval, 10) * 86_400_000;
}

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
  const [endDate,         setEndDate]         = useState(tsToDateInput((record as Medication)?.endDate));
  const [administrationTimes, setAdministrationTimes] = useState<string[]>((record as Medication)?.administrationTimes ?? []);

  // Vaccination-only repeat interval state (not sent directly to Firestore)
  const [repeatInterval, setRepeatInterval] = useState<RepeatInterval>(() => {
    if (category !== 'vaccination') return 'none';
    const vac = record as Vaccination | undefined;
    if (!vac?.nextDueDate || !vac?.date) return 'none';
    return detectRepeatInterval(vac.date, vac.nextDueDate).interval;
  });
  const [customRepeatValue, setCustomRepeatValue] = useState<number>(() => {
    if (category !== 'vaccination') return 1;
    const vac = record as Vaccination | undefined;
    if (!vac?.nextDueDate || !vac?.date) return 1;
    return detectRepeatInterval(vac.date, vac.nextDueDate).customValue;
  });
  const [customRepeatUnit, setCustomRepeatUnit] = useState<CustomRepeatUnit>(() => {
    if (category !== 'vaccination') return 'weeks';
    const vac = record as Vaccination | undefined;
    if (!vac?.nextDueDate || !vac?.date) return 'weeks';
    return detectRepeatInterval(vac.date, vac.nextDueDate).customUnit;
  });

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

    const computedNextDueDate = category === 'vaccination'
      ? computeNextDueDate(date, repeatInterval, customRepeatValue, customRepeatUnit)
      : (nextDueDate ? new Date(nextDueDate).getTime() : undefined);

    const base = {
      title,
      date: new Date(date).getTime(),
      nextDueDate: computedNextDueDate,
      provider: provider || undefined,
      notes: notes || undefined,
    };

    // A medication whose end date is already past is saved as finished (inactive).
    const medEnd = endDate ? new Date(endDate).getTime() : undefined;
    const medActive = isActive && !(medEnd !== undefined && medEnd < Date.now());

    if (isEdit) {
      const extra: Partial<MedicalRecord> = {};
      if (category === 'vaccination') (extra as Partial<Vaccination>).vaccineName = vaccineName;
      if (category === 'medication')  { (extra as Partial<Medication>).medicationName = medicationName; (extra as Partial<Medication>).dosage = dosage || undefined; (extra as Partial<Medication>).isActive = medActive; (extra as Partial<Medication>).endDate = medEnd; (extra as Partial<Medication>).administrationTimes = administrationTimes.length ? administrationTimes : undefined; }
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
        newRecord = { ...fullBase, category: 'medication', medicationName, dosage: dosage || undefined, isActive: medActive, endDate: medEnd, administrationTimes: administrationTimes.length ? administrationTimes : undefined } as Omit<Medication, 'id'>;
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
          <div className="space-y-1">
            <Label htmlFor="endDate">End date (optional)</Label>
            <Input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            <p className="text-xs text-muted-foreground">Once this date passes, the medication is automatically marked finished.</p>
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

      <div className={`grid grid-cols-1 gap-4 ${category === 'vaccination' ? '' : 'sm:grid-cols-2'}`}>
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

        {category === 'vaccination' ? (
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="repeatInterval">Repeat</Label>
              <select
                id="repeatInterval"
                value={repeatInterval}
                onChange={e => setRepeatInterval(e.target.value as RepeatInterval)}
                className="w-full text-sm border border-input rounded-lg px-3 py-1.5 bg-background outline-none focus:border-primary/50 h-9"
              >
                {REPEAT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {repeatInterval === 'custom' && (
              <div className="flex gap-2 items-end">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="customRepeatValue">Every</Label>
                  <Input
                    id="customRepeatValue"
                    type="number"
                    min={1}
                    value={customRepeatValue}
                    onChange={e => setCustomRepeatValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1 flex-1">
                  <Label htmlFor="customRepeatUnit">Unit</Label>
                  <select
                    id="customRepeatUnit"
                    value={customRepeatUnit}
                    onChange={e => setCustomRepeatUnit(e.target.value as CustomRepeatUnit)}
                    className="w-full text-sm border border-input rounded-lg px-3 py-1.5 bg-background outline-none focus:border-primary/50 h-9"
                  >
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <Label htmlFor="nextDueDate">Next Due</Label>
            <Input id="nextDueDate" type="date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} />
          </div>
        )}
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
