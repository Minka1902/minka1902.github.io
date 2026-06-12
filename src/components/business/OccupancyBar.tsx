import { occupancyByDate, todayStr } from '@/lib/occupancy';
import { cn } from '@/lib/utils';
import type { Stay } from '@/types';

interface Props {
  stays: Stay[];
  capacity: number;
  days?: number;
}

// 14-day occupancy strip: one column per day, filled proportionally to how many
// spaces that day already holds. Full days go destructive.
export default function OccupancyBar({ stays, capacity, days = 14 }: Props) {
  const from = todayStr();
  const counts = occupancyByDate(stays, from, days);
  const dates = Object.keys(counts).sort();

  return (
    <div className="flex items-end gap-1">
      {dates.map(date => {
        const count = counts[date];
        const ratio = capacity > 0 ? Math.min(1, count / capacity) : 1;
        const full = capacity > 0 && count >= capacity;
        const d = new Date(`${date}T00:00:00`);
        return (
          <div key={date} className="flex flex-1 flex-col items-center gap-1" title={`${date}: ${count}/${capacity}`}>
            <div className="flex h-12 w-full items-end overflow-hidden rounded-sm bg-muted">
              <div
                className={cn('w-full transition-all', full ? 'bg-destructive' : 'bg-primary/70')}
                style={{ height: `${Math.round(ratio * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{d.getDate()}</span>
          </div>
        );
      })}
    </div>
  );
}
