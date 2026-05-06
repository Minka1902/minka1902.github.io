import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTraining } from '@/hooks/useTraining';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TrainingTypeSelector from './TrainingTypeSelector';
import TrainingTypeSpecificFields from './TrainingTypeSpecificFields';
import type { TrainingTemplate, TrainingType } from '@/types';

interface Props {
  dogId: string;
  template: TrainingTemplate | null;
  onTrainingTypeChange?: (type: TrainingType) => void;
}

export default function TrainingSessionForm({ dogId, template, onTrainingTypeChange }: Props) {
  const { createSession } = useTraining(dogId);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trainingType, setTrainingType] = useState<TrainingType>('obedience');
  const [objective, setObjective] = useState('');
  const [location, setLocation] = useState('');
  const [typeSpecificData, setTypeSpecificData] = useState<Record<string, string | number | boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setObjective(template?.objective ?? '');
  }, [template]);

  // Reset type-specific fields when type changes
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
      exercises: [], typeSpecificData,
      trainerId: user!.uid, trainerName: user!.displayName,
      scheduledAt: now, templateUsed: !!template, createdAt: now, updatedAt: now,
    });
    navigate('/training');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Training Type</Label>
        <TrainingTypeSelector value={trainingType} onChange={handleTypeChange} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="objective" className="text-sm font-medium">Objective <span className="text-destructive">*</span></Label>
        <Input id="objective" placeholder="e.g. Reliable sit-stay at 6 feet" value={objective} onChange={e => setObjective(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="location" className="text-sm font-medium">Location <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input id="location" placeholder="e.g. Backyard, training facility" value={location} onChange={e => setLocation(e.target.value)} />
      </div>

      <TrainingTypeSpecificFields
        trainingType={trainingType}
        values={typeSpecificData}
        onChange={setTypeSpecificData}
      />

      <div className="flex items-center justify-between pt-2">
        {template
          ? <p className="text-xs text-muted-foreground">Pre-filled from saved template</p>
          : <span />
        }
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save Session'}
        </Button>
      </div>
    </form>
  );
}
