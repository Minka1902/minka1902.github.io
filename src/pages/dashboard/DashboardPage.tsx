import { Link } from 'react-router-dom';
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
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-lg text-muted-foreground">No dog profile yet.</p>
        <Link to="/dogs/new" className={cn(buttonVariants())}>Add Your Dog</Link>
      </div>
    );
  }

  if (!activeDog) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-lg text-muted-foreground">Select a dog to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{activeDog.name}</h1>
        {activeDog.breed && (
          <span className="text-sm text-muted-foreground">{activeDog.breed}</span>
        )}
      </div>

      {alerts.length > 0 && (
        <AlertPanel alerts={alerts} />
      )}

      <Card>
        <CardHeader><CardTitle>Quick Log</CardTitle></CardHeader>
        <CardContent>
          <QuickLogBar />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Today's Activity</CardTitle>
            <Link to="/routine" className="text-sm text-muted-foreground hover:underline">
              View all
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
