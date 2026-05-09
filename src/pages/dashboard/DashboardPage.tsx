import { Link } from 'react-router-dom';
import { PawPrint, PlusCircle, Search } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import QuickLogBar from '@/components/routine/QuickLogBar';
import RoutineTimeline from '@/components/routine/RoutineTimeline';
import DayRecapStrip from '@/components/routine/DayRecapStrip';
import DogOverviewCard from '@/components/dog/DogOverviewCard';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { activeDog, dogs } = useDog();

  if (dogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{ backgroundColor: 'var(--primary)', opacity: 0.12 }}
        >
          <PawPrint className="h-10 w-10" style={{ color: 'var(--primary)', opacity: 1 / 0.12 }} />
        </div>
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl absolute"
          style={{ backgroundColor: 'oklch(0.64 0.168 48 / 0.12)' }}
        >
          <PawPrint className="h-10 w-10 text-primary" />
        </div>
        <div>
          <p className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            No dog profile yet
          </p>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
            Add your dog or join an existing one to start coordinating care.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/dogs/new" className={cn(buttonVariants(), 'gap-2 h-10')}>
            <PlusCircle className="h-4 w-4" /> Add Your Dog
          </Link>
          <Link to="/dogs/join" className={cn(buttonVariants({ variant: 'outline' }), 'gap-2 h-10')}>
            <Search className="h-4 w-4" /> Find an Existing Dog
          </Link>
        </div>
      </div>
    );
  }

  if (!activeDog) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Select a dog to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* ── Dog overview ── */}
      <DogOverviewCard dog={activeDog} />

      {/* ── Yesterday's recap ── */}
      <DayRecapStrip dogId={activeDog.id} />

      {/* ── Quick log ── */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50">
          <h2
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}
          >
            Quick Log
          </h2>
        </div>
        <div className="px-4 py-3">
          <QuickLogBar />
        </div>
      </div>

      {/* ── Today's activity ── */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
          <h2
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}
          >
            Today's Activity
          </h2>
          <Link
            to="/routine"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="px-4 py-2">
          <RoutineTimeline dogId={activeDog.id} />
        </div>
      </div>
    </div>
  );
}
