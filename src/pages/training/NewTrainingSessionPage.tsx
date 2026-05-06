import { useState } from 'react';
import { useDog } from '@/contexts/DogContext';
import { useTraining } from '@/hooks/useTraining';
import TrainingSessionForm from '@/components/training/TrainingSessionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TrainingTemplate, TrainingType } from '@/types';

export default function NewTrainingSessionPage() {
  const { activeDog } = useDog();
  const { getTemplate } = useTraining(activeDog?.id ?? '');
  const [template, setTemplate] = useState<TrainingTemplate | null>(null);

  const handleTypeChange = async (type: TrainingType) => {
    if (!activeDog) return;
    const tmpl = await getTemplate(type);
    setTemplate(tmpl);
  };

  if (!activeDog) return <div className="text-muted-foreground">No active dog selected.</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader><CardTitle>New Training Session</CardTitle></CardHeader>
        <CardContent>
          <TrainingSessionForm dogId={activeDog.id} template={template} onTrainingTypeChange={handleTypeChange} />
        </CardContent>
      </Card>
    </div>
  );
}
