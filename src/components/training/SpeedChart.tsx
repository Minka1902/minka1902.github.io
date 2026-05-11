import { useMemo } from 'react';
import { speedSeriesKmh } from '@/lib/geoUtils';
import type { TrackPoint } from '@/types';

interface Props {
  handlerTrack: TrackPoint[];
  dogTrack: TrackPoint[];
  startMs: number;
  height?: number;
}

const W = 600;

export default function SpeedChart({ handlerTrack, dogTrack, startMs, height = 120 }: Props) {
  const hSeries = useMemo(() => speedSeriesKmh(handlerTrack, startMs), [handlerTrack, startMs]);
  const dSeries = useMemo(() => speedSeriesKmh(dogTrack, startMs), [dogTrack, startMs]);

  const allPoints = [...hSeries, ...dSeries];
  if (allPoints.length < 2) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground/50" style={{ height }}>
        Collecting data…
      </div>
    );
  }

  const maxT    = Math.max(...allPoints.map(p => p.t), 1);
  const maxV    = Math.max(...allPoints.map(p => p.v), 5);
  const ceiling = Math.ceil(maxV / 5) * 5 + 2;

  const H = height - 24; // leave 24px for X-axis labels
  const pad = { l: 36, r: 8, t: 8, b: 0 };
  const chartW = W - pad.l - pad.r;
  const chartH = H - pad.t - pad.b;

  const toX = (t: number) => pad.l + (t / maxT) * chartW;
  const toY = (v: number) => pad.t + chartH - (v / ceiling) * chartH;

  const toPath = (series: { t: number; v: number }[]) =>
    series.length < 2 ? '' :
    series.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.t).toFixed(1)},${toY(p.v).toFixed(1)}`).join(' ');

  // Y-axis grid lines at every 5 km/h
  const gridKmh = Array.from({ length: Math.ceil(ceiling / 5) }, (_, i) => i * 5).filter(v => v <= ceiling);

  // X-axis time labels
  const tickCount = Math.min(5, Math.floor(maxT / 60));
  const xTicks = Array.from({ length: tickCount + 1 }, (_, i) => (maxT * i) / tickCount);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  };

  return (
    <div style={{ width: '100%', height }}>
      <svg
        viewBox={`0 0 ${W} ${H + 24}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Grid lines */}
        {gridKmh.map(v => (
          <g key={v}>
            <line
              x1={pad.l} y1={toY(v)} x2={W - pad.r} y2={toY(v)}
              stroke="oklch(0.5 0.01 50 / 0.2)" strokeWidth="1"
              strokeDasharray={v === 0 ? undefined : '4 4'}
            />
            <text x={pad.l - 4} y={toY(v) + 4} textAnchor="end"
              fill="oklch(0.5 0.022 52)" fontSize="10">{v}</text>
          </g>
        ))}

        {/* Dog speed line (behind handler) */}
        {dSeries.length > 1 && (
          <path d={toPath(dSeries)} fill="none"
            stroke="oklch(0.72 0.158 50)" strokeWidth="2"
            strokeDasharray="6 3" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Handler speed line */}
        {hSeries.length > 1 && (
          <>
            {/* Fill area */}
            <path
              d={`${toPath(hSeries)} L${toX(hSeries[hSeries.length - 1].t).toFixed(1)},${(pad.t + chartH).toFixed(1)} L${toX(hSeries[0].t).toFixed(1)},${(pad.t + chartH).toFixed(1)} Z`}
              fill="oklch(0.58 0.18 250 / 0.10)"
            />
            <path d={toPath(hSeries)} fill="none"
              stroke="oklch(0.58 0.18 250)" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {/* X-axis labels */}
        {xTicks.map(t => (
          <text key={t} x={toX(t)} y={H + 18} textAnchor="middle"
            fill="oklch(0.5 0.022 52)" fontSize="10">
            {fmt(t)}
          </text>
        ))}

        {/* Legend */}
        <circle cx={pad.l + 10} cy={pad.t + 6} r="4" fill="oklch(0.58 0.18 250)" />
        <text x={pad.l + 18} y={pad.t + 10} fill="oklch(0.5 0.022 52)" fontSize="10">Handler</text>
        {dSeries.length > 1 && (
          <>
            <line x1={pad.l + 62} y1={pad.t + 6} x2={pad.l + 72} y2={pad.t + 6}
              stroke="oklch(0.72 0.158 50)" strokeWidth="2" strokeDasharray="4 2" />
            <text x={pad.l + 76} y={pad.t + 10} fill="oklch(0.5 0.022 52)" fontSize="10">Dog collar</text>
          </>
        )}
      </svg>
    </div>
  );
}
