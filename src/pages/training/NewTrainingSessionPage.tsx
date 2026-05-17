import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import { useTraining } from '@/hooks/useTraining';
import TrainingSessionForm from '@/components/training/TrainingSessionForm';
import type { TrainingTemplate, TrainingType } from '@/types';

interface TimerState {
  elapsedSeconds?: number;
  quickNotes?: string;
}

export default function NewTrainingSessionPage() {
  const { activeDog } = useDog();
  const { getTemplate } = useTraining(activeDog?.id ?? '');
  const location = useLocation();
  const timerState = location.state as TimerState | null;
  const [template, setTemplate] = useState<TrainingTemplate | null>(null);

  const handleTypeChange = async (type: TrainingType) => {
    if (!activeDog) return;
    const tmpl = await getTemplate(type);
    setTemplate(tmpl);
  };

  if (!activeDog) return <div className="text-muted-foreground">No active dog selected.</div>;

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Page header */}
      <div
        className="relative overflow-hidden rounded-2xl px-5 pt-5 pb-4"
        style={{ background: 'oklch(0.115 0.014 50)', border: '1px solid oklch(0.22 0.012 50)' }}
      >
        <Link
          to="/training"
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-3 transition-colors"
          style={{ color: 'oklch(0.50 0.04 60)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'oklch(0.64 0.168 48)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'oklch(0.50 0.04 60)')}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Training
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
            style={{ backgroundColor: 'oklch(0.64 0.168 48 / 0.12)', border: '1px solid oklch(0.64 0.168 48 / 0.25)' }}
          >
            <FileText className="h-4.5 w-4.5" style={{ color: 'oklch(0.64 0.168 48)' }} />
          </div>
          <div>
            <h1
              className="text-lg font-bold leading-none"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', color: 'oklch(0.92 0.01 72)' }}
            >
              Log Session
            </h1>
            <p className="text-xs mt-0.5 capitalize" style={{ color: 'oklch(0.50 0.02 60)' }}>
              {activeDog.name}
            </p>
          </div>
        </div>
      </div>

      <TrainingSessionForm
        dogId={activeDog.id}
        template={template}
        onTrainingTypeChange={handleTypeChange}
        initialDurationMin={timerState?.elapsedSeconds ? timerState.elapsedSeconds / 60 : undefined}
        initialNotes={timerState?.quickNotes}
      />
    </div>
  );
}
