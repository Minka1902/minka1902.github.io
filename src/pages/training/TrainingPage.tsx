import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crosshair, BarChart2, List, Play, PlusCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useDog } from '@/contexts/DogContext';
import { useTraining } from '@/hooks/useTraining';
import TrainingSessionCard from '@/components/training/TrainingSessionCard';
import ScoreChart from '@/components/training/ScoreChart';
import { Skeleton } from '@/components/ui/skeleton';

type TabId = 'sessions' | 'scores';

// Crosshatch grid pattern for briefing board texture
function CrosshatchPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]" aria-hidden="true">
      <defs>
        <pattern id="crosshatch" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 12L12 0" stroke="white" strokeWidth="0.5" />
          <path d="M0 0L12 12" stroke="white" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#crosshatch)" />
    </svg>
  );
}

export default function TrainingPage() {
  const navigate = useNavigate();
  const { activeDog } = useDog();
  const { sessions, loading } = useTraining(activeDog?.id ?? '');
  const [activeTab, setActiveTab] = useState<TabId>('sessions');
  const today = useMemo(() => new Date(), []);

  const sessionsThisMonth = useMemo(() => {
    const start = startOfMonth(today).getTime();
    const end   = endOfMonth(today).getTime();
    return sessions.filter(s => s.scheduledAt >= start && s.scheduledAt <= end).length;
  }, [sessions, today]);

  const lastScore = useMemo(() => {
    const scored = sessions.filter(s => s.aiScore != null || s.userScore != null);
    if (!scored.length) return null;
    return scored[0].aiScore ?? scored[0].userScore ?? null;
  }, [sessions]);

  if (!activeDog) {
    return <div className="text-muted-foreground">No active dog selected.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Tactical header ── */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ background: 'oklch(0.115 0.014 50)' }}
      >
        <CrosshatchPattern />
        {/* Amber spotlight */}
        <div
          className="absolute -top-8 -right-8 w-40 h-40 pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(0.64 0.168 48 / 0.12) 0%, transparent 70%)' }}
        />

        <div className="relative px-5 pt-5 pb-4">
          {/* Overline */}
          <div className="flex items-center gap-2 mb-3">
            <Crosshair className="h-3 w-3 shrink-0" style={{ color: 'oklch(0.64 0.168 48)' }} />
            <span
              className="text-[9px] font-bold uppercase tracking-[0.22em]"
              style={{ color: 'oklch(0.64 0.168 48 / 0.8)' }}
            >
              K-9 Training Log
            </span>
          </div>

          {/* Dog name */}
          <h1
            className="capitalize leading-none mb-1"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2rem, 6vw, 2.8rem)',
              letterSpacing: '-0.03em',
              color: 'oklch(0.94 0.012 72)',
            }}
          >
            {activeDog.name}
          </h1>
          <p className="text-xs mb-4" style={{ color: 'oklch(1 0 0 / 0.25)' }}>
            {format(today, "MMMM yyyy")} training record
          </p>

          {/* Stats strip */}
          <div
            className="grid grid-cols-3 rounded-xl overflow-hidden"
            style={{ border: '1px solid oklch(1 0 0 / 0.08)' }}
          >
            {[
              { label: 'Sessions', value: sessions.length.toString(), sub: 'total' },
              { label: 'This Month', value: sessionsThisMonth.toString(), sub: 'sessions' },
              { label: 'Last Score', value: lastScore != null ? `${lastScore}` : '—', sub: lastScore != null ? '/ 100' : 'unscored' },
            ].map(({ label, value, sub }, i) => (
              <div
                key={label}
                className="px-4 py-3"
                style={i < 2 ? { borderRight: '1px solid oklch(1 0 0 / 0.08)' } : undefined}
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] mb-0.5" style={{ color: 'oklch(1 0 0 / 0.22)' }}>
                  {label}
                </p>
                <p className="text-xl font-bold leading-none tabular-nums" style={{ fontFamily: 'var(--font-heading)', color: 'oklch(0.94 0.012 72)' }}>
                  {value}
                </p>
                <p className="text-[9px] mt-0.5" style={{ color: 'oklch(1 0 0 / 0.22)' }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action bar */}
        <div
          className="relative flex items-center gap-2.5 px-5 py-3.5"
          style={{ borderTop: '1px solid oklch(1 0 0 / 0.07)' }}
        >
          <button
            onClick={() => navigate('/training/active')}
            className="flex items-center justify-center gap-2 flex-1 h-10 rounded-xl text-sm font-bold transition-all active:scale-[0.97]"
            style={{
              background: 'oklch(0.64 0.168 48)',
              color: 'oklch(0.10 0.01 50)',
              boxShadow: '0 0 0 1px oklch(0.64 0.168 48 / 0.5), 0 2px 8px oklch(0.64 0.168 48 / 0.25)',
            }}
          >
            <Play className="h-4 w-4" />
            Start Live Session
          </button>
          <Link
            to="/training/new"
            className="flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl text-sm font-medium transition-all active:scale-[0.97]"
            style={{
              backgroundColor: 'oklch(1 0 0 / 0.06)',
              color: 'oklch(1 0 0 / 0.55)',
              border: '1px solid oklch(1 0 0 / 0.10)',
            }}
          >
            <PlusCircle className="h-4 w-4" />
            Log
          </Link>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: 'oklch(0.18 0.01 50)' }}>
        {([
          { id: 'sessions', label: 'Sessions', icon: List },
          { id: 'scores',   label: 'Scores',   icon: BarChart2 },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-semibold transition-all"
            style={activeTab === id
              ? { backgroundColor: 'oklch(0.64 0.168 48 / 0.18)', color: 'oklch(0.64 0.168 48)', border: '1px solid oklch(0.64 0.168 48 / 0.30)' }
              : { color: 'oklch(0.50 0.02 60)', border: '1px solid transparent' }}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Score chart ── */}
      {activeTab === 'scores' && (
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'oklch(0.14 0.012 50)', border: '1px solid oklch(0.24 0.012 50)' }}
        >
          <ScoreChart sessions={sessions} />
        </div>
      )}

      {/* ── Sessions skeleton ── */}
      {activeTab === 'sessions' && loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl p-3.5 overflow-hidden"
              style={{ backgroundColor: 'oklch(0.14 0.012 50)', border: '1px solid oklch(0.24 0.012 50)' }}
            >
              <div className="w-[3px] self-stretch rounded-full shrink-0">
                <Skeleton className="w-[3px] h-full rounded-full" />
              </div>
              <Skeleton className="h-4 w-20 rounded-sm shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* ── Sessions list ── */}
      {activeTab === 'sessions' && !loading && (
        sessions.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl"
            style={{ backgroundColor: 'oklch(0.14 0.012 50)', border: '1px dashed oklch(0.28 0.015 50)' }}
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'oklch(0.64 0.168 48 / 0.10)', border: '1px solid oklch(0.64 0.168 48 / 0.20)' }}
            >
              <Crosshair className="h-6 w-6" style={{ color: 'oklch(0.64 0.168 48)' }} />
            </div>
            <div className="text-center px-8">
              <p
                className="font-bold text-lg capitalize"
                style={{ fontFamily: 'var(--font-heading)', color: 'oklch(0.85 0.01 72)' }}
              >
                No sessions logged
              </p>
              <p className="text-sm mt-1" style={{ color: 'oklch(0.50 0.02 60)' }}>
                Start <span className="capitalize">{activeDog.name}</span>'s first training session to begin tracking performance.
              </p>
            </div>
            <Link
              to="/training/new"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
              style={{
                backgroundColor: 'oklch(0.64 0.168 48 / 0.12)',
                color: 'oklch(0.64 0.168 48)',
                border: '1px solid oklch(0.64 0.168 48 / 0.30)',
              }}
            >
              <PlusCircle className="h-4 w-4" />
              Log First Session
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => <TrainingSessionCard key={s.id} session={s} />)}
          </div>
        )
      )}
    </div>
  );
}
