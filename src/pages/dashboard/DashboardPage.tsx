import { useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { PawPrint, PlusCircle, Search, Pencil, GripVertical, LayoutGrid } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import { useRoutine, useRoutineWindow } from '@/hooks/useRoutine';
import { useTraining } from '@/hooks/useTraining';
import QuickLogBar from '@/components/routine/QuickLogBar';
import RoutineTimeline from '@/components/routine/RoutineTimeline';
import DayRecapStrip from '@/components/routine/DayRecapStrip';
import WalkStatsChart from '@/components/routine/monitoring/WalkStatsChart';
import FeedingLogChart from '@/components/routine/monitoring/FeedingLogChart';
import TrainingProgressChart from '@/components/routine/monitoring/TrainingProgressChart';
import { buttonVariants } from '@/components/ui/button';
import { timeAgo, cn } from '@/lib/utils';
import { ROUTINE_TYPES } from '@/lib/constants';

type SectionId = 'hero' | 'quicklog' | 'activity' | 'recap' | 'analytics';
const DEFAULT_SECTION_ORDER: SectionId[] = ['hero', 'quicklog', 'activity', 'recap', 'analytics'];
const LAYOUT_KEY = 'packops_dashboard_layout';

const SECTION_LABELS: Record<SectionId, string> = {
  hero: 'Overview',
  quicklog: 'Quick Log',
  activity: "Today's Activity",
  recap: "Yesterday's Recap",
  analytics: 'Analytics',
};

function loadSectionOrder(): SectionId[] {
  try {
    const saved = localStorage.getItem(LAYOUT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as SectionId[];
      if (parsed.length === DEFAULT_SECTION_ORDER.length && parsed.every(s => DEFAULT_SECTION_ORDER.includes(s))) {
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return DEFAULT_SECTION_ORDER;
}

// Topographic contour lines — field station aesthetic
function TopoPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 440 210"
      aria-hidden="true"
    >
      <path d="M-10,22  C55,14  95,32  168,20  S252,30  328,18  S394,26  450,22"  fill="none" stroke="oklch(1 0 0 / 0.036)" strokeWidth="1"/>
      <path d="M-10,48  C48,40  92,56  162,44  S248,56  320,42  S392,52  450,48"  fill="none" stroke="oklch(1 0 0 / 0.044)" strokeWidth="1"/>
      <path d="M-10,76  C60,68  98,84  164,72  S250,84  322,70  S390,78  450,76"  fill="none" stroke="oklch(1 0 0 / 0.052)" strokeWidth="1"/>
      <path d="M-10,108 C52,100 94,116 166,104 S252,116 326,102 S392,110 450,108" fill="none" stroke="oklch(1 0 0 / 0.040)" strokeWidth="1"/>
      <path d="M-10,140 C58,132 96,148 168,136 S248,148 324,134 S390,142 450,140" fill="none" stroke="oklch(1 0 0 / 0.032)" strokeWidth="1"/>
      <path d="M-10,172 C54,164 90,180 162,168 S246,180 318,166 S388,174 450,172" fill="none" stroke="oklch(1 0 0 / 0.024)" strokeWidth="1"/>
    </svg>
  );
}

function getLastActivityLabel(log: { type: string; customLabel?: string }): string {
  if (log.type === 'pee')  return 'pee break';
  if (log.type === 'poop') return 'bathroom break';
  const rt = ROUTINE_TYPES.find(r => r.type === log.type);
  if (log.type === 'custom' && log.customLabel) return log.customLabel.toLowerCase();
  return rt?.label.toLowerCase() ?? log.type;
}

export default function DashboardPage() {
  const { activeDog, dogs } = useDog();
  const { todayLogs } = useRoutine(activeDog?.id ?? '');
  const { sessions: trainingSessions } = useTraining(activeDog?.id ?? '');

  const monitorStart = useMemo(() => Date.now() - 30 * 24 * 60 * 60 * 1000, []);
  const monitorEnd   = useMemo(() => Date.now() + 86_400_000, []);
  const monitorLogs  = useRoutineWindow(activeDog?.id ?? '', monitorStart, monitorEnd);

  const today = useMemo(() => new Date(), []);

  const lastWalk  = useMemo(() => todayLogs.filter(l => l.type === 'walk').sort((a, b) => b.timestamp - a.timestamp)[0], [todayLogs]);
  const lastEat   = useMemo(() => todayLogs.filter(l => l.type === 'eat').sort((a, b) => b.timestamp - a.timestamp)[0], [todayLogs]);
  const lastDrink = useMemo(() => todayLogs.filter(l => l.type === 'drink').sort((a, b) => b.timestamp - a.timestamp)[0], [todayLogs]);

  const [editLayout, setEditLayout] = useState(false);
  const [sections, setSections] = useState<SectionId[]>(loadSectionOrder);
  const dragSectionRef = useRef<SectionId | null>(null);

  const handleDragStart = (e: React.DragEvent, id: SectionId) => {
    dragSectionRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, id: SectionId) => {
    e.preventDefault();
    const from = dragSectionRef.current;
    if (!from || from === id) return;
    setSections(prev => {
      const next = [...prev];
      const fi = next.indexOf(from), ti = next.indexOf(id);
      next.splice(fi, 1); next.splice(ti, 0, from);
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(next));
      return next;
    });
  };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); dragSectionRef.current = null; };

  if (dogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{ backgroundColor: 'oklch(0.64 0.168 48 / 0.12)' }}
        >
          <PawPrint className="h-10 w-10" style={{ color: 'oklch(0.64 0.168 48)' }} />
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

  const lastLog = todayLogs[0];

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Layout edit toggle */}
      <div className="flex justify-end px-0.5">
        {editLayout ? (
          <button
            onClick={() => setEditLayout(false)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        ) : (
          <button
            onClick={() => setEditLayout(true)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:border-border transition-colors"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Edit Layout
          </button>
        )}
      </div>

      {sections.map(sectionId => {
        const dragLabel = SECTION_LABELS[sectionId];

        if (sectionId === 'hero') return (
          <div key="hero" className={cn('relative', editLayout && 'cursor-grab')}
            draggable={editLayout}
            onDragStart={e => handleDragStart(e, 'hero')}
            onDragOver={e => handleDragOver(e, 'hero')}
            onDrop={handleDrop}
          >
            {editLayout && (
              <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/60 border border-white/20 rounded-full px-2 py-0.5 pointer-events-none select-none">
                <GripVertical className="h-3 w-3 text-white/60" />
                <span className="text-[9px] font-semibold text-white/60 uppercase tracking-wider">{dragLabel}</span>
              </div>
            )}
            <div
              className={cn('relative overflow-hidden rounded-2xl', editLayout && 'ring-1 ring-dashed ring-primary/40')}
              style={{ background: 'oklch(0.135 0.016 50)' }}
            >
              <TopoPattern />
              <div className="absolute -bottom-10 -right-10 w-48 h-48 pointer-events-none"
                style={{ background: 'radial-gradient(circle, oklch(0.64 0.168 48 / 0.16) 0%, transparent 68%)' }} />

              <div className="relative flex items-start justify-between px-5 pt-5 mb-4">
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] leading-none mt-0.5"
                  style={{ color: 'oklch(1 0 0 / 0.28)' }}>
                  {format(today, "EEEE · MMM d")}
                </span>
                <Link to={`/dogs/${activeDog.id}/edit`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95"
                  style={{ backgroundColor: 'oklch(1 0 0 / 0.06)', color: 'oklch(1 0 0 / 0.38)', border: '1px solid oklch(1 0 0 / 0.08)' }}>
                  <Pencil className="h-3 w-3" />Edit
                </Link>
              </div>

              <div className="relative px-5 pb-5">
                <h1 className="capitalize leading-none"
                  style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.6rem, 8vw, 3.5rem)', color: 'oklch(0.94 0.012 72)', letterSpacing: '-0.03em' }}>
                  {activeDog.name}
                </h1>
                {activeDog.breed && (
                  <p className="text-xs mt-1.5 leading-none" style={{ color: 'oklch(1 0 0 / 0.30)' }}>
                    {activeDog.breed}{activeDog.isMix ? ' mix' : ''}
                  </p>
                )}
                <div className="flex items-center gap-2.5 mt-3.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: todayLogs.length > 0 ? 'oklch(0.72 0.158 50)' : 'oklch(1 0 0 / 0.18)' }} />
                  <span className="text-xs tabular-nums" style={{ color: 'oklch(1 0 0 / 0.38)' }}>
                    {todayLogs.length === 0
                      ? 'Nothing logged yet today'
                      : `${todayLogs.length} ${todayLogs.length === 1 ? 'activity' : 'activities'} today`}
                    {lastLog && (
                      <span style={{ color: 'oklch(1 0 0 / 0.22)' }}>
                        {' '}· Last: {getLastActivityLabel(lastLog)} {timeAgo(lastLog.timestamp)}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="relative grid grid-cols-3" style={{ borderTop: '1px solid oklch(1 0 0 / 0.07)' }}>
                {([
                  { label: 'Walk',  log: lastWalk  },
                  { label: 'Ate',   log: lastEat   },
                  { label: 'Water', log: lastDrink },
                ] as const).map(({ label, log }, i) => (
                  <div key={label} className="px-5 py-3.5"
                    style={i < 2 ? { borderRight: '1px solid oklch(1 0 0 / 0.07)' } : undefined}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: 'oklch(1 0 0 / 0.24)' }}>{label}</p>
                    <p className="text-xs font-semibold leading-none" style={{ color: log ? 'oklch(0.72 0.158 50)' : 'oklch(1 0 0 / 0.18)' }}>
                      {log ? timeAgo(log.timestamp) : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

        if (sectionId === 'quicklog') return (
          <div key="quicklog" className={cn('relative', editLayout && 'cursor-grab')}
            draggable={editLayout}
            onDragStart={e => handleDragStart(e, 'quicklog')}
            onDragOver={e => handleDragOver(e, 'quicklog')}
            onDrop={handleDrop}
          >
            {editLayout && (
              <div className="flex items-center gap-1 mb-1 pl-1">
                <GripVertical className="h-3 w-3 text-primary/60" />
                <span className="text-[9px] font-semibold text-primary/60 uppercase tracking-wider">{dragLabel}</span>
              </div>
            )}
            <div className={cn(editLayout && 'ring-1 ring-dashed ring-primary/30 rounded-2xl px-2 pt-2 pb-1')}>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-3 px-0.5">Quick Log</p>
              <QuickLogBar />
            </div>
          </div>
        );

        if (sectionId === 'activity') return (
          <div key="activity" className={cn('relative', editLayout && 'cursor-grab')}
            draggable={editLayout}
            onDragStart={e => handleDragStart(e, 'activity')}
            onDragOver={e => handleDragOver(e, 'activity')}
            onDrop={handleDrop}
          >
            {editLayout && (
              <div className="flex items-center gap-1 mb-1 pl-1">
                <GripVertical className="h-3 w-3 text-primary/60" />
                <span className="text-[9px] font-semibold text-primary/60 uppercase tracking-wider">{dragLabel}</span>
              </div>
            )}
            <div className={cn(editLayout && 'ring-1 ring-dashed ring-primary/30 rounded-2xl')}>
              <div className="flex items-baseline justify-between mb-3 px-0.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Today's Activity</p>
                <Link to="/routine" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all →</Link>
              </div>
              <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="px-4 py-2">
                  <RoutineTimeline dogId={activeDog.id} dogName={activeDog.name} />
                </div>
              </div>
            </div>
          </div>
        );

        if (sectionId === 'recap') return (
          <div key="recap" className={cn('relative', editLayout && 'cursor-grab')}
            draggable={editLayout}
            onDragStart={e => handleDragStart(e, 'recap')}
            onDragOver={e => handleDragOver(e, 'recap')}
            onDrop={handleDrop}
          >
            {editLayout && (
              <div className="flex items-center gap-1 mb-1 pl-1">
                <GripVertical className="h-3 w-3 text-primary/60" />
                <span className="text-[9px] font-semibold text-primary/60 uppercase tracking-wider">{dragLabel}</span>
              </div>
            )}
            <div className={cn(editLayout && 'ring-1 ring-dashed ring-primary/30 rounded-2xl p-1')}>
              <DayRecapStrip dogId={activeDog.id} />
            </div>
          </div>
        );

        // sectionId === 'analytics'
        return (
          <div key="analytics" className={cn('relative', editLayout && 'cursor-grab')}
            draggable={editLayout}
            onDragStart={e => handleDragStart(e, 'analytics')}
            onDragOver={e => handleDragOver(e, 'analytics')}
            onDrop={handleDrop}
          >
            {editLayout && (
              <div className="flex items-center gap-1 mb-1 pl-1">
                <GripVertical className="h-3 w-3 text-primary/60" />
                <span className="text-[9px] font-semibold text-primary/60 uppercase tracking-wider">{dragLabel}</span>
              </div>
            )}
            <div className={cn(editLayout && 'ring-1 ring-dashed ring-primary/30 rounded-2xl p-1')}>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-3 px-0.5">
                Analytics · Last 30 Days
              </p>
              <div className="space-y-3">
                <div className="rounded-2xl border bg-card p-4"><WalkStatsChart logs={monitorLogs} /></div>
                <div className="rounded-2xl border bg-card p-4"><FeedingLogChart logs={monitorLogs} /></div>
                <div className="rounded-2xl border bg-card p-4"><TrainingProgressChart sessions={trainingSessions} /></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
