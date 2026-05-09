import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BlockKind = 'base-pending' | 'base-completed' | 'standalone-log' | 'scheduled-log';

export interface StatusBadge {
  label: string;
  bg: string;
  fg: string;
}

interface Props {
  kind: BlockKind;
  icon: string;
  color: string;
  label: string;
  sublabel?: string;
  statusBadge?: StatusBadge;
  top: number;
  height: number;
  onDelete?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

export default function TimelineBlock({
  kind, icon, color, label, sublabel, statusBadge,
  top, height, onDelete, draggable, onDragStart,
}: Props) {
  // both kinds share the same muted/dashed visual treatment
  const isPending = kind === 'base-pending' || kind === 'scheduled-log';

  return (
    <div
      className={cn(
        'absolute left-12 right-2 rounded-lg px-2 py-1 group select-none',
        isPending ? 'opacity-60' : 'opacity-100',
        draggable && 'cursor-grab active:cursor-grabbing',
      )}
      style={{
        top,
        height,
        backgroundColor: color + (isPending ? '10' : '1a'),
        border: `1.5px ${isPending ? 'dashed' : 'solid'} ${color}${isPending ? '40' : '70'}`,
      }}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <div className="flex items-start gap-1.5 h-full overflow-hidden">
        <span className="text-sm shrink-0 leading-none mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold leading-tight truncate">{label}</p>
          {sublabel && (
            <p className="text-[10px] text-muted-foreground leading-tight truncate">{sublabel}</p>
          )}
          {statusBadge && (
            <span
              className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-0.5"
              style={{ backgroundColor: statusBadge.bg, color: statusBadge.fg }}
            >
              {statusBadge.label}
            </span>
          )}
        </div>
        {onDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded text-muted-foreground hover:text-destructive transition-all mt-0.5"
            aria-label="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
