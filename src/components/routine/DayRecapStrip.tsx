import { useMemo } from 'react';
import { useYesterdayLogs } from '@/hooks/useYesterdayLogs';
import { ROUTINE_TYPES } from '@/lib/constants';
import { fmtDate } from '@/lib/utils';
import type { RoutineType } from '@/types';

interface Props {
  dogId: string;
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

  return (
    <div className="rounded-xl border bg-muted/30 px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        Yesterday · {fmtDate(yesterday)}
      </p>
      {logged.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity logged yesterday.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {logged.map(rt => (
            <span
              key={rt.type}
              className="inline-flex items-center gap-1.5 rounded-full bg-background border px-3 py-1 text-sm"
            >
              <span className="text-base leading-none">{rt.icon}</span>
              <span className="font-medium">{rt.label}</span>
              <span className="text-muted-foreground">×{counts[rt.type]}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
