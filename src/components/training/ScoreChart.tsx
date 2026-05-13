import { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import {
  ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import type { ScatterShapeProps } from 'recharts';
import type { TrainingSession } from '@/types';
import { TRAINING_TYPES } from '@/lib/constants';

interface Props {
  sessions: TrainingSession[];
}

const TYPE_COLORS: Record<string, string> = {
  obedience: '#F59E0B',
  agility: '#22c55e',
  scent_work: '#a78bfa',
  tracking: '#60a5fa',
  retrieve: '#fb923c',
};

function getColor(type: string) {
  return TYPE_COLORS[type] ?? 'oklch(0.55 0.15 280)';
}

export default function ScoreChart({ sessions }: Props) {
  const data = useMemo(() => {
    const cutoff = subDays(new Date(), 90).getTime();
    return sessions
      .filter(s => {
        const score = s.userScore ?? s.aiScore;
        return score !== undefined && s.scheduledAt >= cutoff;
      })
      .sort((a, b) => a.scheduledAt - b.scheduledAt)
      .map(s => ({
        date: format(new Date(s.scheduledAt), 'MMM d'),
        score: s.userScore ?? s.aiScore!,
        type: s.trainingType,
        typeLabel: TRAINING_TYPES.find(t => t.type === s.trainingType)?.label ?? s.trainingType,
        isUserOverride: s.userScore !== undefined,
        aiScore: s.aiScore,
      }));
  }, [sessions]);

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <p className="text-sm font-medium text-muted-foreground">No scored sessions yet</p>
        <p className="text-xs text-muted-foreground/60">Analyze a session to see scores here</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">Session scores — last 90 days</p>
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 10%)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'oklch(0.5 0 0)' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'oklch(0.5 0 0)' }} />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as { typeLabel: string; score: number; isUserOverride: boolean; aiScore?: number };
            return (
              <div className="rounded-lg border bg-popover text-popover-foreground shadow-md px-3 py-2 text-xs">
                <p className="font-semibold mb-1">{label} · {p.typeLabel}</p>
                <p style={{ color: 'oklch(0.55 0.15 280)' }}>
                  <span className="font-medium">{p.isUserOverride ? 'Your score' : 'AI score'}:</span> {p.score}/100
                </p>
                {p.isUserOverride && p.aiScore !== undefined && (
                  <p className="text-muted-foreground">AI score: {p.aiScore}/100</p>
                )}
              </div>
            );
          }} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="oklch(0.55 0.15 280)"
            strokeWidth={2}
            dot={false}
          />
          <Scatter
            dataKey="score"
            shape={(props: ScatterShapeProps) => {
              const cx = (props.cx ?? 0) as number;
              const cy = (props.cy ?? 0) as number;
              const payload = (props.payload ?? {}) as { type: string; isUserOverride: boolean };
              const color = getColor(payload.type);
              return (
                <circle
                  cx={cx} cy={cy} r={4}
                  fill={color}
                  stroke={payload.isUserOverride ? 'white' : color}
                  strokeWidth={payload.isUserOverride ? 2 : 0}
                />
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {TRAINING_TYPES.find(t => t.type === type)?.label ?? type}
          </span>
        ))}
      </div>
    </div>
  );
}
