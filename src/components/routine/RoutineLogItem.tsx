import { X } from 'lucide-react';
import { ROUTINE_TYPES, PEE_COLOR, POOP_COLOR } from '@/lib/constants';
import { fmtTime, timeAgo } from '@/lib/utils';
import type { RoutineLog } from '@/types';

interface Props {
  log: RoutineLog;
  onDelete?: (id: string) => void;
}

function getTypeMeta(log: RoutineLog) {
  if (log.type === 'pee')  return { icon: '🌿', color: PEE_COLOR,  label: 'Pee' };
  if (log.type === 'poop') return { icon: '💩', color: POOP_COLOR, label: 'Poop' };
  const rt = ROUTINE_TYPES.find(r => r.type === log.type);
  return {
    icon:  rt?.icon  ?? '•',
    color: rt?.color ?? '#F59E0B',
    label: log.type === 'custom' && log.customLabel ? log.customLabel : (rt?.label ?? log.type),
  };
}

export default function RoutineLogItem({ log, onDelete }: Props) {
  const { icon, color, label } = getTypeMeta(log);

  return (
    <div className="flex items-center gap-3 py-3 group">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl"
        style={{ backgroundColor: color + '18', border: `1.5px solid ${color}38` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          <span className="tabular-nums">{fmtTime(log.timestamp)}</span>
          <span className="mx-1 opacity-40">·</span>
          {timeAgo(log.timestamp)}
          <span className="mx-1 opacity-40">·</span>
          {log.loggedByName}
        </p>
        {log.notes && <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{log.notes}</p>}
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(log.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          aria-label="Delete"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
