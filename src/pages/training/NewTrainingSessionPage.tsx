import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import { useTraining } from '@/hooks/useTraining';
import TrainingSessionForm from '@/components/training/TrainingSessionForm';
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
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/training" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">New Training Session</h1>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <TrainingSessionForm dogId={activeDog.id} template={template} onTrainingTypeChange={handleTypeChange} />
      </div>
    </div>
  );
}
