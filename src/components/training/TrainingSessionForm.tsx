import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTraining } from '@/hooks/useTraining';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import TrainingTypeSelector from './TrainingTypeSelector';
import TrainingTypeSpecificFields from './TrainingTypeSpecificFields';
import type { TrainingTemplate, TrainingType } from '@/types';

interface Props {
  dogId: string;
  template: TrainingTemplate | null;
  onTrainingTypeChange?: (type: TrainingType) => void;
  initialDurationMin?: number;
  initialNotes?: string;
}

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: 'oklch(0.14 0.012 50)', border: '1px solid oklch(0.24 0.012 50)' }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ borderBottom: '1px solid oklch(0.22 0.01 50)' }}
      >
        <div className="h-3 w-[3px] rounded-full" style={{ backgroundColor: 'oklch(0.64 0.168 48)' }} />
        <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: 'oklch(0.64 0.168 48 / 0.8)' }}>
          {label}
        </p>
      </div>
      <div className="px-4 py-4 space-y-4">
        {children}
      </div>
    </div>
  );
}

function FieldLabel({ htmlFor, children, optional }: { htmlFor?: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold mb-1.5"
      style={{ color: 'oklch(0.62 0.02 60)' }}
    >
      {children}
      {optional && <span className="ml-1.5 font-normal" style={{ color: 'oklch(0.45 0.01 60)' }}>optional</span>}
    </label>
  );
}

export default function TrainingSessionForm({ dogId, template, onTrainingTypeChange, initialDurationMin, initialNotes }: Props) {
  const { createSession } = useTraining(dogId);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trainingType, setTrainingType] = useState<TrainingType>('obedience');
  const [objective, setObjective] = useState('');
  const [location, setLocation] = useState('');
  const [durationMin, setDurationMin] = useState<string>(initialDurationMin ? String(Math.round(initialDurationMin)) : '');
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [typeSpecificData, setTypeSpecificData] = useState<Record<string, string | number | boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setObjective(template?.objective ?? '');
  }, [template]);

  useEffect(() => {
    setTypeSpecificData({});
  }, [trainingType]);

  const handleTypeChange = (type: TrainingType) => {
    setTrainingType(type);
    onTrainingTypeChange?.(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const now = Date.now();
    await createSession({
      dogId, trainingType, objective, location: location || undefined,
      durationActualMin: durationMin ? parseFloat(durationMin) : undefined,
      notes: notes || undefined,
      exercises: [], typeSpecificData,
      trainerId: user!.uid, trainerName: user!.displayName,
      scheduledAt: now, templateUsed: !!template, createdAt: now, updatedAt: now,
    });
    navigate('/training');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {template && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ backgroundColor: 'oklch(0.64 0.168 48 / 0.10)', color: 'oklch(0.64 0.168 48)', border: '1px solid oklch(0.64 0.168 48 / 0.20)' }}
        >
          <span>📋</span>
          <span>Pre-filled from saved template</span>
        </div>
      )}

      {/* Training Type */}
      <FormSection label="Training Type">
        <TrainingTypeSelector value={trainingType} onChange={handleTypeChange} />
      </FormSection>

      {/* Session Details */}
      <FormSection label="Session Details">
        <div>
          <FieldLabel htmlFor="objective">Objective <span style={{ color: 'oklch(0.60 0.20 25)' }}>*</span></FieldLabel>
          <Input
            id="objective"
            placeholder="e.g. Reliable sit-stay at 6 feet"
            value={objective}
            onChange={e => setObjective(e.target.value)}
            required
            className="text-sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="durationMin">Duration (min)</FieldLabel>
            <Input
              id="durationMin"
              type="number"
              min={0}
              step={0.5}
              placeholder="30"
              value={durationMin}
              onChange={e => setDurationMin(e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <FieldLabel htmlFor="location">Location <span className="font-normal" style={{ color: 'oklch(0.45 0.01 60)' }}>optional</span></FieldLabel>
            <Input
              id="location"
              placeholder="Backyard, facility…"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>
      </FormSection>

      {/* Type-specific fields */}
      <FormSection label="Type-Specific Data">
        <TrainingTypeSpecificFields
          trainingType={trainingType}
          values={typeSpecificData}
          onChange={setTypeSpecificData}
        />
      </FormSection>

      {/* Notes */}
      <FormSection label="Handler Notes">
        <div>
          <FieldLabel htmlFor="notes" optional>Notes</FieldLabel>
          <textarea
            id="notes"
            rows={3}
            placeholder="Observations, incidents, corrections, progress notes…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full rounded-lg border text-sm resize-none outline-none px-3 py-2.5 transition-colors"
            style={{
              backgroundColor: 'oklch(0.18 0.01 50)',
              borderColor: 'oklch(0.28 0.01 50)',
              color: 'inherit',
            }}
            onFocus={e => (e.target.style.borderColor = 'oklch(0.64 0.168 48 / 0.60)')}
            onBlur={e => (e.target.style.borderColor = 'oklch(0.28 0.01 50)')}
          />
        </div>
      </FormSection>

      {/* Sticky submit */}
      <div className="sticky bottom-4 pt-2">
        <button
          type="submit"
          disabled={submitting || !objective.trim()}
          className="w-full h-12 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40"
          style={{
            background: submitting ? 'oklch(0.45 0.10 48)' : 'oklch(0.64 0.168 48)',
            color: 'oklch(0.10 0.01 50)',
            boxShadow: '0 0 0 1px oklch(0.64 0.168 48 / 0.4), 0 4px 12px oklch(0.64 0.168 48 / 0.20)',
          }}
        >
          {submitting ? 'Saving session…' : 'Save Session'}
        </button>
      </div>
    </form>
  );
}
