import { useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, PlusCircle, Search } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import { useRoutineWindow } from '@/hooks/useRoutine';
import { useTraining } from '@/hooks/useTraining';
import DogOverviewCard from '@/components/dog/DogOverviewCard';
import MedicalSummaryCard from '@/components/medical/MedicalSummaryCard';
import RoutineTimeline from '@/components/routine/RoutineTimeline';
import WalkStatsChart from '@/components/routine/monitoring/WalkStatsChart';
import FeedingLogChart from '@/components/routine/monitoring/FeedingLogChart';
import TrainingProgressChart from '@/components/routine/monitoring/TrainingProgressChart';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { activeDog, dogs } = useDog();
  const { sessions: trainingSessions } = useTraining(activeDog?.id ?? '');

  const monitorStart = useMemo(() => Date.now() - 30 * 24 * 60 * 60 * 1000, []);
  const monitorEnd   = useMemo(() => Date.now() + 86_400_000, []);
  const monitorLogs  = useRoutineWindow(activeDog?.id ?? '', monitorStart, monitorEnd);

  // Mobile swipe state
  const [mobilePage, setMobilePage] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) setMobilePage(p => Math.min(p + 1, 2));
      else setMobilePage(p => Math.max(p - 1, 0));
    }
  };

  // ── Empty states ───────────────────────────────────────────────────────────
  if (dogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{ backgroundColor: 'oklch(0.64 0.168 48 / 0.12)' }}
        >
          <PawPrint className="h-10 w-10" style={{ color: 'var(--primary)' }} />
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
    <>
      {/* ── Desktop layout (lg+) — Command Center ─────────────────────────── */}
      <div className="hidden lg:flex h-[calc(100dvh-56px)] gap-3 p-4 overflow-hidden">
        {/* Left column — dog overview card + medical summary */}
        <div className="w-[35%] flex-shrink-0 min-h-0 flex flex-col gap-3">
          <DogOverviewCard dog={activeDog} showQuickLog />
          <MedicalSummaryCard dogId={activeDog.id} />
        </div>
        {/* Right column */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Analytics panel — 60% height */}
          <div className="flex-[3] overflow-hidden min-h-0 rounded-2xl border bg-card p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2">Analytics · Last 30 Days</p>
            <div className="flex gap-3 h-32">
              <div className="flex-1 min-w-0"><WalkStatsChart logs={monitorLogs} /></div>
              <div className="flex-1 min-w-0"><FeedingLogChart logs={monitorLogs} /></div>
              <div className="flex-1 min-w-0"><TrainingProgressChart sessions={trainingSessions} /></div>
            </div>
          </div>
          {/* Timeline panel — 40% height, scrolls internally */}
          <div className="flex-[2] overflow-y-auto rounded-2xl border bg-card p-4 min-h-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-3">Today's Activity</p>
            <RoutineTimeline dogId={activeDog.id} dogName={activeDog.name} canDelete />
          </div>
        </div>
      </div>

      {/* ── Tablet layout (md–lg) — Stacked panels, scrollable ────────────── */}
      <div className="hidden md:flex lg:hidden flex-col gap-3 p-3 max-w-2xl mx-auto w-full">
        <DogOverviewCard dog={activeDog} showQuickLog />
        <MedicalSummaryCard dogId={activeDog.id} />
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-3">Today's Activity</p>
          <RoutineTimeline dogId={activeDog.id} dogName={activeDog.name} canDelete />
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2">Analytics · Last 30 Days</p>
          <div className="space-y-3">
            <WalkStatsChart logs={monitorLogs} />
            <FeedingLogChart logs={monitorLogs} />
            <TrainingProgressChart sessions={trainingSessions} />
          </div>
        </div>
      </div>

      {/* ── Mobile layout (<md) — Swipeable full-screen pages ─────────────── */}
      <div className="md:hidden flex flex-col" style={{ height: 'calc(100dvh - 56px - 68px)' }}>
        {/* Swipe container */}
        <div
          className="flex-1 flex overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${mobilePage * 100}%)`, width: '300%' }}
          >
            {/* Page 1: Dog Overview */}
            <div className="w-1/3 h-full flex-shrink-0 overflow-y-auto p-3">
              <DogOverviewCard dog={activeDog} showQuickLog />
            </div>
            {/* Page 2: Timeline */}
            <div className="w-1/3 h-full flex-shrink-0 overflow-y-auto p-3">
              <div className="rounded-2xl border bg-card p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-3">Today's Activity</p>
                <RoutineTimeline dogId={activeDog.id} dogName={activeDog.name} canDelete />
              </div>
            </div>
            {/* Page 3: Analytics */}
            <div className="w-1/3 h-full flex-shrink-0 overflow-y-auto p-3 flex flex-col gap-3">
              <MedicalSummaryCard dogId={activeDog.id} />
              <div className="rounded-2xl border bg-card p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-3">Analytics · Last 30 Days</p>
                <div className="flex flex-col gap-4">
                  <div className="min-h-[200px]"><WalkStatsChart logs={monitorLogs} /></div>
                  <div className="min-h-[200px]"><FeedingLogChart logs={monitorLogs} /></div>
                  <div className="min-h-[200px]"><TrainingProgressChart sessions={trainingSessions} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Dot indicators */}
        <div className="flex-shrink-0 flex justify-center items-center gap-2 py-2">
          {[0, 1, 2].map(i => (
            <button
              key={i}
              onClick={() => setMobilePage(i)}
              className={cn(
                'rounded-full transition-all duration-200',
                i === mobilePage ? 'w-5 h-2 bg-primary' : 'w-2 h-2 bg-muted-foreground/30'
              )}
              aria-label={`Page ${i + 1}`}
              aria-current={i === mobilePage ? 'page' : undefined}
            />
          ))}
        </div>
      </div>
    </>
  );
}
