import { Link } from 'react-router-dom';
import { PawPrint, PlusCircle, Search } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import QuickLogBar from '@/components/routine/QuickLogBar';
import RoutineTimeline from '@/components/routine/RoutineTimeline';
import DayRecapStrip from '@/components/routine/DayRecapStrip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { activeDog, dogs } = useDog();

  if (dogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <PawPrint className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">No dog profile yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your dog or join an existing one.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/dogs/new" className={cn(buttonVariants(), 'gap-2')}>
            <PlusCircle className="h-4 w-4" /> Add Your Dog
          </Link>
          <Link to="/dogs/join" className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}>
            <Search className="h-4 w-4" /> Find an Existing Dog
          </Link>
        </div>
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
          <h1 className="text-3xl font-bold tracking-tight capitalize">{activeDog.name}</h1>
          {activeDog.breed && (
            <p className="text-sm text-muted-foreground mt-0.5">{activeDog.breed}{activeDog.isMix ? ' mix' : ''}</p>
          )}
        </div>
        <Link to={`/dogs/${activeDog.id}/edit`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          Edit profile
        </Link>
      </div>

      <DayRecapStrip dogId={activeDog.id} />

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
