import { useMemo } from 'react';
import { subDays, format, startOfDay } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import type { RoutineLog } from '@/types';

interface Props {
  logs: RoutineLog[];
}

export default function WalkStatsChart({ logs }: Props) {
  const data = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(today, 6 - i);
      const dayStart = day.getTime();
      const dayEnd = dayStart + 86_400_000 - 1;
      const walks = logs.filter(l => l.type === 'walk' && l.timestamp >= dayStart && l.timestamp <= dayEnd);
      const totalDuration = walks.reduce((s, w) => s + (w.walkDurationMin ?? 0), 0);
      const totalDistance = walks.reduce((s, w) => s + (w.walkDistanceKm ?? 0), 0);
      return {
        day: format(day, 'EEE'),
        walks: walks.length,
        duration: walks.length ? Math.round(totalDuration / walks.length) : 0,
        distance: Math.round(totalDistance * 10) / 10,
      };
    });
  }, [logs]);

  const hasAnyData = data.some(d => d.walks > 0);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Walk Activity</h3>
        <p className="text-xs text-muted-foreground">Last 7 days</p>
      </div>

      {!hasAnyData ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No walks logged in the past week.</p>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 0.1)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'oklch(0.55 0 0)' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'oklch(0.55 0 0)' }} axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  label={label}
                  formatEntry={(v, name) => [
                    name === 'walks' ? `${v} walk${v !== 1 ? 's' : ''}` : `${v} min avg`,
                    name === 'walks' ? 'Walks' : 'Avg duration',
                  ]}
                />
              )}
            />
            <Bar dataKey="walks" name="walks" fill="oklch(0.64 0.168 48)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="duration" name="duration" fill="oklch(0.64 0.168 48 / 0.3)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
