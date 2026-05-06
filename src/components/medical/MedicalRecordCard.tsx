import { X, CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { fmtDate } from '@/lib/utils';
import type { MedicalRecord } from '@/types';

interface Props {
  record: MedicalRecord;
  onDelete?: (id: string) => void;
}

export default function MedicalRecordCard({ record, onDelete }: Props) {
  const isOverdue = record.nextDueDate && record.nextDueDate < Date.now();
  const isDueSoon = record.nextDueDate && !isOverdue && record.nextDueDate < Date.now() + 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3 group hover:bg-muted/30 transition-colors">
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm">{record.title}</p>
          {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
          {isDueSoon && !isOverdue && <Badge className="text-xs bg-amber-500 hover:bg-amber-500">Due soon</Badge>}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
          <span>{fmtDate(record.date)}</span>
          {record.nextDueDate && (
            <>
              <span>·</span>
              <CalendarClock className="h-3 w-3" />
              <span>Due {fmtDate(record.nextDueDate)}</span>
            </>
          )}
          {record.provider && <><span>·</span><span>{record.provider}</span></>}
        </div>
        {record.notes && <p className="text-xs text-muted-foreground truncate">{record.notes}</p>}
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(record.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive"
          aria-label="Delete"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
