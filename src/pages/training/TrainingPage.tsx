import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, PlusCircle, Play, BarChart2, List } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import { useTraining } from '@/hooks/useTraining';
import TrainingSessionCard from '@/components/training/TrainingSessionCard';
import ScoreChart from '@/components/training/ScoreChart';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TabId = 'sessions' | 'scores';

export default function TrainingPage() {
  const navigate = useNavigate();
  const { activeDog } = useDog();
  const { sessions, loading } = useTraining(activeDog?.id ?? '');
  const [activeTab, setActiveTab] = useState<TabId>('sessions');

  if (!activeDog) {
    return <div className="text-muted-foreground">No active dog selected.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Training</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/training/active')}
            className={cn(buttonVariants({ size: 'sm' }), 'gap-2')}
            style={{ backgroundColor: 'oklch(0.55 0.15 280)', borderColor: 'oklch(0.55 0.15 280)' }}
          >
            <Play className="h-4 w-4" /> Start Session
          </button>
          <Link to="/training/new" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}>
            <PlusCircle className="h-4 w-4" /> Log Session
          </Link>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/60 w-fit">
        {([
          { id: 'sessions', label: 'Sessions', icon: List },
          { id: 'scores', label: 'Scores', icon: BarChart2 },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-medium transition-all',
              activeTab === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'scores' && (
        <div className="rounded-2xl border bg-card shadow-sm p-5">
          <ScoreChart sessions={sessions} />
        </div>
      )}

      {activeTab === 'sessions' && loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'sessions' && !loading && (
        sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-xl border border-dashed bg-background">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Dumbbell className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-semibold">No sessions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Log <span className="capitalize">{activeDog.name}</span>'s first training session to start tracking progress.</p>
            </div>
            <Link to="/training/new" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}>
              <PlusCircle className="h-4 w-4" /> Log First Session
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(s => <TrainingSessionCard key={s.id} session={s} />)}
          </div>
        )
      )}
    </div>
  );
}
