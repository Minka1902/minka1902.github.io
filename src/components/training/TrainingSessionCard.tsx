import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { TRAINING_TYPES } from '@/lib/constants';
import type { TrainingSession } from '@/types';

interface Props { session: TrainingSession }

const TYPE_COLORS: Record<string, string> = {
  obedience:             'oklch(0.55 0.15 230)',
  agility:               'oklch(0.65 0.18 50)',
  scent_work:            'oklch(0.58 0.18 300)',
  tracking:              'oklch(0.55 0.18 175)',
  retrieve:              'oklch(0.55 0.18 145)',
  heel:                  'oklch(0.64 0.168 48)',
  recall:                'oklch(0.60 0.20 25)',
  place_stay:            'oklch(0.58 0.15 200)',
  impulse_control:       'oklch(0.58 0.16 260)',
  cooperative_care:      'oklch(0.60 0.14 160)',
  socialization:         'oklch(0.60 0.16 340)',
  noise_desensitization: 'oklch(0.56 0.12 220)',
  crate_conditioning:    'oklch(0.55 0.10 240)',
  treadmill:             'oklch(0.60 0.12 180)',
  search:                'oklch(0.62 0.18 80)',
  bark_alert:            'oklch(0.60 0.20 15)',
  bite:                  'oklch(0.55 0.22 15)',
  other:                 'oklch(0.50 0.05 240)',
};

function ScoreRing({ score }: { score: number }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? 'oklch(0.72 0.19 145)' : score >= 60 ? 'oklch(0.64 0.168 48)' : 'oklch(0.60 0.20 25)';

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: 36, height: 36 }}>
      <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="oklch(0.3 0 0 / 0.4)" strokeWidth="2.5" />
        <circle
          cx="18" cy="18" r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-bold tabular-nums" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export default function TrainingSessionCard({ session }: Props) {
  const typeMeta = TRAINING_TYPES.find(t => t.type === session.trainingType);
  const typeLabel = typeMeta?.label ?? session.trainingType.replace(/_/g, ' ');
  const typeColor = TYPE_COLORS[session.trainingType] ?? TYPE_COLORS.other;
  const score = session.aiScore ?? session.userScore;

  return (
    <Link to={`/training/${session.id}`} className="block group">
      <div
        className="relative flex items-center gap-3 rounded-xl overflow-hidden transition-all duration-150 group-hover:translate-y-[-1px] group-hover:shadow-md"
        style={{
          backgroundColor: 'oklch(0.14 0.012 50)',
          border: '1px solid oklch(0.24 0.012 50)',
          boxShadow: '0 1px 3px oklch(0 0 0 / 0.3)',
        }}
      >
        {/* Left type stripe */}
        <div className="w-[3px] self-stretch shrink-0" style={{ backgroundColor: typeColor }} />

        {/* Type badge */}
        <div className="shrink-0 py-3 pl-1 pr-0">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-sm"
            style={{ backgroundColor: typeColor + '22', color: typeColor }}
          >
            {typeLabel}
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 py-3">
          <p
            className="text-sm font-semibold leading-snug truncate"
            style={{ color: 'oklch(0.92 0.01 72)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}
          >
            {session.objective}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] tabular-nums" style={{ color: 'oklch(0.55 0.02 60)' }}>
              {format(new Date(session.scheduledAt), 'MMM d')}
            </span>
            <span style={{ color: 'oklch(0.35 0 0)' }}>·</span>
            <span className="text-[10px]" style={{ color: 'oklch(0.55 0.02 60)' }}>
              {session.trainerName}
            </span>
            {session.durationActualMin && (
              <>
                <span style={{ color: 'oklch(0.35 0 0)' }}>·</span>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums"
                  style={{ backgroundColor: 'oklch(0.22 0.01 50)', color: 'oklch(0.60 0.04 60)' }}
                >
                  {session.durationActualMin}m
                </span>
              </>
            )}
          </div>
        </div>

        {/* Score ring or chevron */}
        <div className="shrink-0 pr-3">
          {score != null ? (
            <ScoreRing score={score} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'oklch(0.38 0 0)' }}>
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
    </Link>
  );
}
