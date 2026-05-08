import { Trash2, CalendarClock, AlertTriangle, CheckCircle } from 'lucide-react';
import { fmtDate } from '@/lib/utils';
import type { MedicalRecord } from '@/types';

interface Props {
  record: MedicalRecord;
  onDelete?: (id: string) => void;
}

function getUrgency(record: MedicalRecord): 'overdue' | 'today' | 'soon' | 'ok' | 'none' {
  if (!record.nextDueDate) return 'none';
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  if (record.nextDueDate < now - dayMs) return 'overdue';
  if (record.nextDueDate < now + dayMs) return 'today';
  if (record.nextDueDate < now + 7 * dayMs) return 'soon';
  return 'ok';
}

const URGENCY_STYLES = {
  overdue: { bar: '#EF4444', badge: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Overdue', icon: AlertTriangle },
  today:   { bar: '#F59E0B', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: 'Due today', icon: CalendarClock },
  soon:    { bar: '#F59E0B', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: 'Due soon', icon: CalendarClock },
  ok:      { bar: '#22C55E', badge: 'bg-green-500/10 text-green-600 border-green-500/20', label: 'Upcoming', icon: CheckCircle },
  none:    { bar: 'transparent', badge: '', label: '', icon: null },
};

export default function MedicalRecordCard({ record, onDelete }: Props) {
  const urgency = getUrgency(record);
  const style = URGENCY_STYLES[urgency];

  return (
    <div className="group relative flex rounded-xl border bg-card overflow-hidden hover:bg-muted/20 transition-colors">
      {/* Left urgency bar */}
      <div className="w-1 shrink-0" style={{ backgroundColor: style.bar }} />

      <div className="flex flex-1 items-start gap-3 px-4 py-3 min-w-0">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-semibold text-sm leading-tight">{record.title}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span>{fmtDate(record.date)}</span>
            {record.nextDueDate && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <CalendarClock className="h-3 w-3" />
                  {fmtDate(record.nextDueDate)}
                </span>
              </>
            )}
            {record.provider && <><span>·</span><span>{record.provider}</span></>}
          </div>
          {record.notes && <p className="text-xs text-muted-foreground/70 truncate">{record.notes}</p>}
        </div>

        {urgency !== 'none' && (
          <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
            {style.label}
          </span>
        )}

        {onDelete && (
          <button
            onClick={() => onDelete(record.id)}
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive"
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
