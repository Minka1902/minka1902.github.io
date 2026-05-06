import { Link } from 'react-router-dom';
import { PawPrint, PlusCircle } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import { useAlerts } from '@/hooks/useAlerts';
import QuickLogBar from '@/components/routine/QuickLogBar';
import RoutineTimeline from '@/components/routine/RoutineTimeline';
import AlertPanel from '@/components/alerts/AlertPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { activeDog, dogs } = useDog();
  const alerts = useAlerts(activeDog?.id ?? '');

  if (dogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <PawPrint className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">No dog profile yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your dog to get started tracking care and training.</p>
        </div>
        <Link to="/dogs/new" className={cn(buttonVariants(), 'gap-2')}>
          <PlusCircle className="h-4 w-4" /> Add Your Dog
        </Link>
      </div>
    );
  }

  if (!activeDog) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-lg text-muted-foreground">Select a dog to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Dog header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{activeDog.name}</h1>
          {activeDog.breed && (
            <p className="text-sm text-muted-foreground mt-0.5">{activeDog.breed}{activeDog.isMix ? ' mix' : ''}</p>
          )}
        </div>
        <Link to={`/dogs/${activeDog.id}/edit`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          Edit profile
        </Link>
      </div>

      {alerts.length > 0 && <AlertPanel alerts={alerts} />}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Log</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickLogBar />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Today's Activity</CardTitle>
            <Link to="/routine" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <RoutineTimeline dogId={activeDog.id} />
        </CardContent>
      </Card>
    </div>
  );
}
