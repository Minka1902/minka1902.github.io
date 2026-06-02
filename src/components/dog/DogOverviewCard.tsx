import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { useRoutine } from '@/hooks/useRoutine';
import LabDog from '@/components/dog/LabDog';
import QuickLogBar from '@/components/routine/QuickLogBar';
import { timeAgo } from '@/lib/utils';
import { ROUTINE_TYPES } from '@/lib/constants';
import type { Dog, RoutineType } from '@/types';

const STAT_KEYS: RoutineType[] = ['walk', 'eat', 'drink'];

interface DogOverviewCardProps {
  dog: Dog;
  showQuickLog?: boolean;
}

export default function DogOverviewCard({ dog, showQuickLog }: DogOverviewCardProps) {
  const { todayLogs } = useRoutine(dog.id);

  const lastOf = useMemo(() => {
    const map: Partial<Record<RoutineType, number>> = {};
    for (const log of todayLogs) {
      if (!(log.type in map)) map[log.type] = log.timestamp;
    }
    return map;
  }, [todayLogs]);

  const totalToday = todayLogs.length;
  const lastLog = todayLogs[0];
  const lastLabel = lastLog
    ? ROUTINE_TYPES.find(r => r.type === lastLog.type)?.label.toLowerCase()
    : null;

  return (
    <div
      className="h-full flex flex-col rounded-2xl overflow-hidden border bg-card"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Orange accent stripe */}
      <div
        className="h-[3px] w-full flex-shrink-0"
        style={{ background: 'linear-gradient(90deg, var(--primary) 0%, oklch(0.78 0.14 62) 100%)' }}
      />

      {/* Main row — flex-1 so it grows */}
      <div className="flex-1 px-3 py-2.5 md:px-4 md:pt-3 md:pb-3 flex flex-row items-center gap-3 md:items-start md:gap-3">
        {/* Avatar */}
        <div
          className="shrink-0 w-12 h-12 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex items-end justify-center"
          style={{ background: 'oklch(0.95 0.06 65)' }}
        >
          {dog.photoURL ? (
            <img src={dog.photoURL} alt={dog.name} className="w-full h-full object-cover" />
          ) : (
            <LabDog size={48} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1
                className="text-lg sm:text-xl font-bold leading-tight truncate"
                style={{
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.025em',
                  color: 'var(--foreground)',
                }}
              >
                {dog.name}
              </h1>
              {dog.breed && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {dog.breed}{dog.isMix ? ' mix' : ''}
                </p>
              )}
            </div>

            <Link
              to={`/dogs/${dog.id}/edit`}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-muted/60 transition-colors cursor-pointer"
              style={{ color: 'var(--muted-foreground)' }}
              aria-label="Edit dog profile"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          </div>

          {/* Activity pill */}
          <div className="mt-1.5 md:mt-2 flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: totalToday > 0 ? 'var(--primary)' : 'var(--muted-foreground)' }}
            />
            <span className="text-xs text-muted-foreground leading-none">
              {totalToday > 0
                ? `${totalToday} activit${totalToday === 1 ? 'y' : 'ies'} today`
                : 'No activity yet today'}
              {lastLog && lastLabel && (
                <> &middot; Last: {lastLabel} {timeAgo(lastLog.timestamp)}</>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        {STAT_KEYS.map((key, i) => {
          const rt = ROUTINE_TYPES.find(r => r.type === key)!;
          const ts = lastOf[key];
          return (
            <div
              key={key}
              className="flex flex-col gap-0.5 px-4 py-3"
              style={{
                borderRight: i < 2 ? '1px solid var(--border)' : undefined,
              }}
            >
              <span className="text-[10px] uppercase tracking-[0.1em] font-semibold text-muted-foreground">
                {rt.label}
              </span>
              {ts ? (
                <span
                  className="text-sm font-semibold leading-snug"
                  style={{ color: 'var(--primary)' }}
                >
                  {timeAgo(ts)}
                </span>
              ) : (
                <span className="text-xs" style={{ color: 'oklch(0.65 0 0 / 0.4)' }}>—</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick log (conditional) */}
      {showQuickLog && (
        <div className="border-t px-4 py-3 flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-2">Quick Log</p>
          <QuickLogBar />
        </div>
      )}
    </div>
  );
}
