import { useMemo } from 'react';
import { useYesterdayLogs } from '@/hooks/useYesterdayLogs';
import { ROUTINE_TYPES, PEE_COLOR, POOP_COLOR } from '@/lib/constants';
import { fmtDate } from '@/lib/utils';
import type { RoutineType } from '@/types';

interface Props {
  dogId: string;
}

function getColor(type: RoutineType): string {
  if (type === 'pee')  return PEE_COLOR;
  if (type === 'poop') return POOP_COLOR;
  return ROUTINE_TYPES.find(r => r.type === type)?.color ?? '#F59E0B';
}

function getIcon(type: RoutineType): string {
  if (type === 'pee')  return '🌿';
  if (type === 'poop') return '💩';
  return ROUTINE_TYPES.find(r => r.type === type)?.icon ?? '•';
}

export default function DayRecapStrip({ dogId }: Props) {
  const logs = useYesterdayLogs(dogId);
  const yesterday = useMemo(() => Date.now() - 86_400_000, []);

  const counts = useMemo(() => {
    const map: Partial<Record<RoutineType, number>> = {};
    for (const log of logs) {
      map[log.type] = (map[log.type] ?? 0) + 1;
    }
    return map;
  }, [logs]);

  const logged = ROUTINE_TYPES.filter(rt => counts[rt.type]);

  if (logged.length === 0) return null;

  return (
    <div className="px-1">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
          Yesterday
        </span>
        <span className="text-[10px] text-muted-foreground/40">{fmtDate(yesterday)}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {logged.map(rt => {
          const color = getColor(rt.type);
          const icon  = getIcon(rt.type);
          const count = counts[rt.type] ?? 0;
          return (
            <span
              key={rt.type}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: color + '14',
                border: `1px solid ${color}30`,
                color,
              }}
            >
              <span className="text-sm leading-none">{icon}</span>
              {rt.label}
              {count > 1 && <span className="opacity-60 font-normal ml-0.5">×{count}</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}
