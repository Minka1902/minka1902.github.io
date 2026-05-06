import { useDog } from '@/contexts/DogContext';
import QuickLogBar from '@/components/routine/QuickLogBar';
import RoutineTimeline from '@/components/routine/RoutineTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fmtDate } from '@/lib/utils';

export default function RoutinePage() {
  const { activeDog } = useDog();

  if (!activeDog) {
    return <div className="text-muted-foreground">No active dog selected.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Routine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{fmtDate(Date.now())}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Quick Log</CardTitle></CardHeader>
        <CardContent><QuickLogBar /></CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Today's Activity</CardTitle></CardHeader>
        <CardContent>
          <RoutineTimeline dogId={activeDog.id} canDelete />
        </CardContent>
      </Card>
    </div>
  );
}
