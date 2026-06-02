import { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, PlusCircle, Search, LayoutGrid, GripHorizontal } from 'lucide-react';
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
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// ── Grid layout persistence ────────────────────────────────────────────────
const DASH_GRID_KEY = 'packops_dashboard_grid_layout';

const DEFAULT_DASH_LAYOUT: GridLayout.Layout[] = [
  { i: 'dog', x: 0, y: 0, w: 4, h: 4, minW: 2, minH: 2 },
  { i: 'medical', x: 0, y: 4, w: 4, h: 2, minW: 2, minH: 1 },
  { i: 'timeline', x: 4, y: 0, w: 5, h: 6, minW: 3, minH: 3 },
  { i: 'analytics', x: 9, y: 0, w: 3, h: 6, minW: 2, minH: 3 },
];

function loadLayout(): GridLayout.Layout[] {
  try {
    const saved = localStorage.getItem(DASH_GRID_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_DASH_LAYOUT;
  } catch {
    return DEFAULT_DASH_LAYOUT;
  }
}

export default function DashboardPage() {
  const { activeDog, dogs } = useDog();
  const { sessions: trainingSessions } = useTraining(activeDog?.id ?? '');

  const monitorStart = useMemo(() => Date.now() - 30 * 24 * 60 * 60 * 1000, []);
  const monitorEnd = useMemo(() => Date.now() + 86_400_000, []);
  const monitorLogs = useRoutineWindow(activeDog?.id ?? '', monitorStart, monitorEnd);

  // Mobile swipe state
  const [mobilePage, setMobilePage] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  // Grid editor state
  const [editDashboard, setEditDashboard] = useState(false);
  const [dashLayout, setDashLayout] = useState<GridLayout.Layout[]>(loadLayout);

  // Container width measurement for GridLayout
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(1200);
  useEffect(() => {
    const el = gridContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      setGridWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

  // Shared drag handle overlay for edit mode
  const DragHandle = () => (
    <div className="drag-handle absolute top-0 left-0 right-0 h-6 cursor-grab flex items-center justify-center z-10 rounded-t-xl bg-border/30 hover:bg-border/50 transition-colors">
      <GripHorizontal className="h-3 w-3 text-muted-foreground/60" />
    </div>
  );

  return (
    <>
      {/* ── Desktop/tablet grid layout (md+) — Drag & resize grid ─────────── */}
      <div className="hidden md:flex flex-col h-[calc(100dvh-56px)] overflow-hidden">
        {/* Grid toolbar */}
        <div className="flex items-center justify-end px-4 py-1 gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setEditDashboard(!editDashboard)}
            className="hidden md:flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg border transition-colors"
            style={editDashboard ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', borderColor: 'var(--primary)' } : {}}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            {editDashboard ? 'Done' : 'Edit layout'}
          </button>
        </div>

        {/* Grid container */}
        <div ref={gridContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4">
          <GridLayout
            className="layout"
            layout={dashLayout}
            cols={12}
            rowHeight={70}
            width={gridWidth}
            isDraggable={editDashboard}
            isResizable={editDashboard}
            onLayoutChange={(newLayout) => {
              setDashLayout(newLayout);
              localStorage.setItem(DASH_GRID_KEY, JSON.stringify(newLayout));
            }}
            draggableHandle=".drag-handle"
            margin={[5, 5]}
          >
            {/* Dog overview widget */}
            <div key="dog" className={cn(
              'relative overflow-hidden rounded-2xl',
              editDashboard && 'ring-2 ring-dashed ring-border'
            )}>
              {editDashboard && <DragHandle />}
              <div className={cn('h-full', editDashboard && 'pt-6', 'flex-start')}>
                <DogOverviewCard dog={activeDog} showQuickLog />
              </div>
            </div>

            {/* Medical summary widget */}
            <div
              key="medical"
              className={cn(
                'relative overflow-hidden rounded-2xl',
                editDashboard && 'ring-2 ring-dashed ring-border'
              )}
            >
              {editDashboard && <DragHandle />}
              <div className={cn('h-full', editDashboard && 'pt-6')}>
                <MedicalSummaryCard dogId={activeDog.id} />
              </div>
            </div>

            {/* Timeline widget */}
            <div
              key="timeline"
              className={cn(
                'relative overflow-hidden rounded-2xl border bg-card',
                editDashboard && 'ring-2 ring-dashed ring-border'
              )}
            >
              {editDashboard && <DragHandle />}
              <div className={cn('max-h-[calc(100%-32px)] overflow-y-auto p-4', editDashboard && 'pt-8')}>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-3">
                  Today's Activity
                </p>
                <RoutineTimeline dogId={activeDog.id} dogName={activeDog.name} canDelete />
              </div>
            </div>

            {/* Analytics widget */}
            <div
              key="analytics"
              className={cn(
                'relative overflow-hidden rounded-2xl border bg-card',
                editDashboard && 'ring-2 ring-dashed ring-border'
              )}
            >
              {editDashboard && <DragHandle />}
              <div className={cn('h-full overflow-y-auto p-4', editDashboard && 'pt-8')}>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2">
                  Analytics · Last 30 Days
                </p>
                <div className="space-y-3">
                  <WalkStatsChart logs={monitorLogs} />
                  <FeedingLogChart logs={monitorLogs} />
                  <TrainingProgressChart sessions={trainingSessions} />
                </div>
              </div>
            </div>
          </GridLayout>
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
            style={{ transform: `translateX(-${(mobilePage * 100) / 3 * 2}%)`, width: '300%' }}
          >
            {/* Page 1: Dog Overview */}
            <div className="w-2/3 h-full flex-shrink-0 overflow-y-auto p-3">
              <DogOverviewCard dog={activeDog} showQuickLog />
            </div>
            {/* Page 2: Timeline */}
            <div className="w-2/3 h-full flex-shrink-0 overflow-y-auto p-3">
              <div className="rounded-2xl border bg-card p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-3">Today's Activity</p>
                <RoutineTimeline dogId={activeDog.id} dogName={activeDog.name} canDelete />
              </div>
            </div>
            {/* Page 3: Analytics */}
            <div className="w-2/3 h-full flex-shrink-0 overflow-y-auto p-3 flex flex-col gap-3">
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
