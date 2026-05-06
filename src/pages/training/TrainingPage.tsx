import { Link } from 'react-router-dom';
import { useDog } from '@/contexts/DogContext';
import { useTraining } from '@/hooks/useTraining';
import TrainingSessionCard from '@/components/training/TrainingSessionCard';
import { buttonVariants } from '@/components/ui/button';

export default function TrainingPage() {
  const { activeDog } = useDog();
  const { sessions } = useTraining(activeDog?.id ?? '');

  if (!activeDog) {
    return <div className="text-muted-foreground">No active dog selected.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Training</h1>
        <Link to="/training/new" className={buttonVariants()}>+ New Session</Link>
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No training sessions logged yet.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => <TrainingSessionCard key={s.id} session={s} />)}
        </div>
      )}
    </div>
  );
}
