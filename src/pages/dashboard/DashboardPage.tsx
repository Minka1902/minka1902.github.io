import { Link } from 'react-router-dom';
import { PawPrint, PlusCircle, Search, Pencil } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import QuickLogBar from '@/components/routine/QuickLogBar';
import RoutineTimeline from '@/components/routine/RoutineTimeline';
import DayRecapStrip from '@/components/routine/DayRecapStrip';
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
      {/* ── Dog hero header ── */}
      <div
        className="relative overflow-hidden rounded-2xl px-5 py-5"
        style={{
          background: 'linear-gradient(135deg, var(--sidebar) 0%, oklch(0.18 0.018 50) 100%)',
        }}
      >
        {/* Dot overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, oklch(1 0 0 / 0.04) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* Decorative paw */}
        <div className="absolute -right-8 -bottom-8 opacity-[0.05]">
          <PawPrint style={{ width: 160, height: 160, color: 'oklch(0.72 0.158 50)' }} />
        </div>

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] mb-1" style={{ color: 'oklch(1 0 0 / 35%)' }}>
              Active dog
            </p>
            <h1
              className="text-4xl capitalize leading-none"
              style={{
                fontFamily: 'var(--font-heading)',
                fontVariationSettings: "'SOFT' 20, 'WONK' 0",
                color: 'oklch(0.92 0.010 72)',
                letterSpacing: '-0.03em',
              }}
            >
              {activeDog.name}
            </h1>
            {activeDog.breed && (
              <p className="text-sm mt-1.5" style={{ color: 'oklch(1 0 0 / 40%)' }}>
                {activeDog.breed}{activeDog.isMix ? ' mix' : ''}
              </p>
            )}
          </div>
          <Link
            to={`/dogs/${activeDog.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 mt-1"
            style={{
              backgroundColor: 'oklch(1 0 0 / 8%)',
              color: 'oklch(1 0 0 / 60%)',
            }}
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Link>
        </div>
      </div>

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
