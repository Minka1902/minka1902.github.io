import { Badge } from '@/components/ui/badge';
import { fmtDate } from '@/lib/utils';
import type { OrgDailyReport, DogMood } from '@/types';

const MOOD_CONFIG: Record<DogMood, { emoji: string; label: string; style: string }> = {
  great:   { emoji: '🌟', label: 'Great',   style: 'bg-green-100 text-green-800 border-green-200' },
  good:    { emoji: '😊', label: 'Good',    style: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  okay:    { emoji: '😐', label: 'Okay',    style: 'bg-slate-100 text-slate-700 border-slate-200' },
  anxious: { emoji: '😰', label: 'Anxious', style: 'bg-amber-100 text-amber-800 border-amber-200' },
  tired:   { emoji: '😴', label: 'Tired',   style: 'bg-purple-100 text-purple-800 border-purple-200' },
  sick:    { emoji: '🤒', label: 'Sick',    style: 'bg-red-100 text-red-700 border-red-200' },
};

interface Props {
  report: OrgDailyReport;
}

export default function DailyReportCard({ report }: Props) {
  const mood = MOOD_CONFIG[report.mood] ?? MOOD_CONFIG.okay;

  return (
    <div className="rounded-xl border bg-card px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold capitalize">{report.dogName}</p>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${mood.style}`}>
            {mood.emoji} {mood.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{fmtDate(report.createdAt)}</p>
      </div>

      <p className="text-sm text-foreground leading-relaxed">{report.summary}</p>

      {report.activities.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {report.activities.map((a, i) => (
            <span key={i} className="text-[11px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground">
              {a}
            </span>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">Written by {report.staffName}</p>
    </div>
  );
}
