import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { PawPrint, PlusCircle, Search, Pencil } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import { useRoutine } from '@/hooks/useRoutine';
import QuickLogBar from '@/components/routine/QuickLogBar';
import RoutineTimeline from '@/components/routine/RoutineTimeline';
import DayRecapStrip from '@/components/routine/DayRecapStrip';
import { buttonVariants } from '@/components/ui/button';
import { timeAgo, cn } from '@/lib/utils';
import { ROUTINE_TYPES } from '@/lib/constants';

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

  const today = useMemo(() => new Date(), []);

  const lastWalk  = useMemo(() => todayLogs.filter(l => l.type === 'walk').sort((a, b) => b.timestamp - a.timestamp)[0], [todayLogs]);
  const lastEat   = useMemo(() => todayLogs.filter(l => l.type === 'eat').sort((a, b) => b.timestamp - a.timestamp)[0], [todayLogs]);
  const lastDrink = useMemo(() => todayLogs.filter(l => l.type === 'drink').sort((a, b) => b.timestamp - a.timestamp)[0], [todayLogs]);

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

      {/* ── Field dispatch hero ── */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ background: 'oklch(0.135 0.016 50)' }}
      >
        <TopoPattern />

        {/* Amber glow — bottom-right atmosphere */}
        <div
          className="absolute -bottom-10 -right-10 w-48 h-48 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, oklch(0.64 0.168 48 / 0.16) 0%, transparent 68%)',
          }}
        />

        {/* Header row */}
        <div className="relative flex items-start justify-between px-5 pt-5 mb-4">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.18em] leading-none mt-0.5"
            style={{ color: 'oklch(1 0 0 / 0.28)' }}
          >
            {format(today, "EEEE · MMM d")}
          </span>
          <Link
            to={`/dogs/${activeDog.id}/edit`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95"
            style={{
              backgroundColor: 'oklch(1 0 0 / 0.06)',
              color: 'oklch(1 0 0 / 0.38)',
              border: '1px solid oklch(1 0 0 / 0.08)',
            }}
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Link>
        </div>

        {/* Dog name block */}
        <div className="relative px-5 pb-5">
          <h1
            className="capitalize leading-none"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.6rem, 8vw, 3.5rem)',
              color: 'oklch(0.94 0.012 72)',
              letterSpacing: '-0.03em',
            }}
          >
            {activeDog.name}
          </h1>

          {activeDog.breed && (
            <p className="text-xs mt-1.5 leading-none" style={{ color: 'oklch(1 0 0 / 0.30)' }}>
              {activeDog.breed}{activeDog.isMix ? ' mix' : ''}
            </p>
          )}

          {/* Activity pulse */}
          <div className="flex items-center gap-2.5 mt-3.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
              style={{
                backgroundColor: todayLogs.length > 0
                  ? 'oklch(0.72 0.158 50)'
                  : 'oklch(1 0 0 / 0.18)',
              }}
            />
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

        {/* Briefing strip — walk / eat / water */}
        <div
          className="relative grid grid-cols-3"
          style={{ borderTop: '1px solid oklch(1 0 0 / 0.07)' }}
        >
          {([
            { label: 'Walk',  log: lastWalk  },
            { label: 'Ate',   log: lastEat   },
            { label: 'Water', log: lastDrink },
          ] as const).map(({ label, log }, i) => (
            <div
              key={label}
              className="px-5 py-3.5"
              style={i < 2 ? { borderRight: '1px solid oklch(1 0 0 / 0.07)' } : undefined}
            >
              <p
                className="text-[9px] font-bold uppercase tracking-[0.14em] mb-1"
                style={{ color: 'oklch(1 0 0 / 0.24)' }}
              >
                {label}
              </p>
              <p
                className="text-xs font-semibold leading-none"
                style={{ color: log ? 'oklch(0.72 0.158 50)' : 'oklch(1 0 0 / 0.18)' }}
              >
                {log ? timeAgo(log.timestamp) : '—'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Log ── */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-3 px-0.5">
          Quick Log
        </p>
        <QuickLogBar />
      </div>

      {/* ── Today's Activity ── */}
      <div>
        <div className="flex items-baseline justify-between mb-3 px-0.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Today's Activity
          </p>
          <Link
            to="/routine"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="px-4 py-2">
            <RoutineTimeline dogId={activeDog.id} dogName={activeDog.name} />
          </div>
        </div>
      </div>

      {/* ── Yesterday's recap ── */}
      <DayRecapStrip dogId={activeDog.id} />

    </div>
  );
}
