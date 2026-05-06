import { Button } from '@/components/ui/button';
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
    <div className="flex items-center gap-3 py-2">
      <span className="text-xl w-7 text-center">{routineType?.icon ?? '•'}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{routineType?.label ?? log.type}</p>
        <p className="text-xs text-muted-foreground">
          {fmtTime(log.timestamp)} · {timeAgo(log.timestamp)} · {log.loggedByName}
        </p>
        {log.notes && <p className="text-xs text-muted-foreground mt-0.5">{log.notes}</p>}
      </div>
      {onDelete && (
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => onDelete(log.id)}>
          ×
        </Button>
      )}
    </div>
  );
}
