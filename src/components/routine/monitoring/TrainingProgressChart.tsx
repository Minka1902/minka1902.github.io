import { useMemo } from 'react';
import { subDays, startOfWeek, format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import type { TrainingSession } from '@/types';

interface Props {
  sessions: TrainingSession[];
}

export default function TrainingProgressChart({ sessions }: Props) {
  const data = useMemo(() => {
    const now = Date.now();
    const cutoff = subDays(new Date(), 28).getTime();
    const recent = sessions.filter(s => s.scheduledAt >= cutoff && s.scheduledAt <= now);

    return Array.from({ length: 4 }, (_, i) => {
      const weekStart = startOfWeek(subDays(new Date(), (3 - i) * 7), { weekStartsOn: 1 });
      const weekEnd = subDays(startOfWeek(subDays(new Date(), (2 - i) * 7), { weekStartsOn: 1 }), 1);
      const count = recent.filter(s => s.scheduledAt >= weekStart.getTime() && s.scheduledAt <= weekEnd.getTime() + 86_400_000).length;
      return {
        week: `Wk ${format(weekStart, 'M/d')}`,
        sessions: count,
      };
    });
  }, [sessions]);

  const hasAnyData = data.some(d => d.sessions > 0);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Training Sessions</h3>
        <p className="text-xs text-muted-foreground">Last 4 weeks</p>
      </div>

      {!hasAnyData ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No training sessions in the past month.</p>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 0.1)" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'oklch(0.55 0 0)' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'oklch(0.55 0 0)' }} axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  label={label}
                  formatEntry={(v) => [`${v} session${v !== 1 ? 's' : ''}`, 'Training']}
                />
              )}
            />
            <Bar dataKey="sessions" name="Sessions" fill="oklch(0.55 0.15 280)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
