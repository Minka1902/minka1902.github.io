import { Link } from 'react-router-dom';
import { Dumbbell, PlusCircle } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import { useTraining } from '@/hooks/useTraining';
import TrainingSessionCard from '@/components/training/TrainingSessionCard';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function TrainingPage() {
  const { activeDog } = useDog();
  const { sessions } = useTraining(activeDog?.id ?? '');

  if (!activeDog) {
    return <div className="text-muted-foreground">No active dog selected.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Training</h1>
        <Link to="/training/new" className={cn(buttonVariants({ size: 'sm' }), 'gap-2')}>
          <PlusCircle className="h-4 w-4" /> New Session
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-xl border border-dashed bg-background">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Dumbbell className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-semibold">No sessions yet</p>
            <p className="text-sm text-muted-foreground mt-1">Log {activeDog.name}'s first training session to start tracking progress.</p>
          </div>
          <Link to="/training/new" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}>
            <PlusCircle className="h-4 w-4" /> Log First Session
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => <TrainingSessionCard key={s.id} session={s} />)}
        </div>
      )}
    </div>
  );
}
