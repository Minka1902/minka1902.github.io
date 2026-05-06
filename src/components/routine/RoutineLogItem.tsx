import { X } from 'lucide-react';
import { ROUTINE_TYPES } from '@/lib/constants';
import { fmtTime, timeAgo } from '@/lib/utils';
import type { RoutineLog } from '@/types';

interface Props {
  log: RoutineLog;
  onDelete?: (id: string) => void;
}

export default function RoutineLogItem({ log, onDelete }: Props) {
  const routineType = ROUTINE_TYPES.find(r => r.type === log.type);
  return (
    <div className="flex items-center gap-3 py-3 group">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xl">
        {routineType?.icon ?? '•'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{routineType?.label ?? log.type}</p>
        <p className="text-xs text-muted-foreground">
          {fmtTime(log.timestamp)} · {timeAgo(log.timestamp)} · {log.loggedByName}
        </p>
        {log.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.notes}</p>}
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(log.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive"
          aria-label="Delete"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
