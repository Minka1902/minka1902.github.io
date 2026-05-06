import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTraining } from '@/hooks/useTraining';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TrainingTypeSelector from './TrainingTypeSelector';
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setObjective(template?.objective ?? '');
  }, [template]);

  const handleTypeChange = (type: TrainingType) => {
    setTrainingType(type);
    onTrainingTypeChange?.(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const now = Date.now();
    await createSession({
      dogId, trainingType, objective, location: location || undefined, exercises: [],
      trainerId: user!.uid, trainerName: user!.displayName,
      scheduledAt: now, templateUsed: !!template, createdAt: now, updatedAt: now,
    });
    navigate('/training');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="space-y-1">
        <Label>Training Type</Label>
        <TrainingTypeSelector value={trainingType} onChange={handleTypeChange} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="objective">Objective</Label>
        <Input id="objective" value={objective} onChange={e => setObjective(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="location">Location</Label>
        <Input id="location" value={location} onChange={e => setLocation(e.target.value)} />
      </div>
      {template && (
        <p className="text-xs text-muted-foreground">Pre-filled from template</p>
      )}
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save Session'}
      </Button>
    </form>
  );
}
