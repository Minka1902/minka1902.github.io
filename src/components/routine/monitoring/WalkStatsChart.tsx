import { useMemo } from 'react';
import { subDays, format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import type { RoutineLog } from '@/types';

interface Props {
  logs: RoutineLog[];
}

export default function WalkStatsChart({ logs }: Props) {
  const { data, isAggregated } = useMemo(() => {
    const cutoff = subDays(new Date(), 7).getTime();
    const walks = logs
      .filter(l => l.type === 'walk' && l.timestamp >= cutoff)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (walks.length <= 20) {
      return {
        isAggregated: false,
        data: walks.map(w => ({
          key: format(new Date(w.timestamp), 'EEE h:mm a'),
          duration: w.walkDurationMin ?? 0,
          distance: w.walkDistanceKm ?? 0,
        })),
      };
    }

    // > 20 walks: aggregate by day
    const byDay = new Map<string, { count: number; totalDuration: number; totalDistance: number }>();
    walks.forEach(w => {
      const day = format(new Date(w.timestamp), 'EEE');
      const prev = byDay.get(day) ?? { count: 0, totalDuration: 0, totalDistance: 0 };
      byDay.set(day, {
        count: prev.count + 1,
        totalDuration: prev.totalDuration + (w.walkDurationMin ?? 0),
        totalDistance: prev.totalDistance + (w.walkDistanceKm ?? 0),
      });
    });

    return {
      isAggregated: true,
      data: Array.from(byDay.entries()).map(([day, d]) => ({
        key: day,
        duration: d.count ? Math.round(d.totalDuration / d.count) : 0,
        distance: Math.round(d.totalDistance * 10) / 10,
      })),
    };
  }, [logs]);

  const hasAnyData = data.length > 0;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Walk Activity</h3>
        <p className="text-xs text-muted-foreground">
          {isAggregated ? 'Last 7 days (avg per day)' : 'Last 7 days · each walk'}
        </p>
      </div>

      {!hasAnyData ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No walks logged in the past week.</p>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 0.08)" vertical={false} />
            <XAxis dataKey="key" tick={{ fontSize: 10, fill: 'oklch(0.55 0 0)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'oklch(0.55 0 0)' }} axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  label={label}
                  formatEntry={(v, name) => [
                    name === 'duration' ? `${v} min` : `${v} km`,
                    name === 'duration' ? 'Duration' : 'Distance',
                  ]}
                />
              )}
            />
            <Bar dataKey="duration" name="duration" fill="oklch(0.64 0.168 48)" radius={[4, 4, 0, 0]} activeBar={{ fill: 'oklch(0.64 0.168 48 / 0.45)', radius: 4 }} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
