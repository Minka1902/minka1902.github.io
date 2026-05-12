import { useMemo } from 'react';
import { subDays, format, startOfDay } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { RoutineLog } from '@/types';

interface Props {
  logs: RoutineLog[];
}

export default function FeedingLogChart({ logs }: Props) {
  const data = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(today, 6 - i);
      const dayStart = day.getTime();
      const dayEnd = dayStart + 86_400_000 - 1;
      const dayLogs = logs.filter(l => l.timestamp >= dayStart && l.timestamp <= dayEnd);
      return {
        day: format(day, 'EEE'),
        meals: dayLogs.filter(l => l.type === 'eat').length,
        water: dayLogs.filter(l => l.type === 'drink').length,
      };
    });
  }, [logs]);

  const hasAnyData = data.some(d => d.meals > 0 || d.water > 0);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Feeding & Water</h3>
        <p className="text-xs text-muted-foreground">Last 7 days</p>
      </div>

      {!hasAnyData ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No feeding or water logs in the past week.</p>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={10} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 0.1)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'oklch(0.55 0 0)' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'oklch(0.55 0 0)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 8, fontSize: 12,
                border: '1px solid oklch(0.85 0 0)',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
              }}
            />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="meals" name="Meals" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="water" name="Water" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
