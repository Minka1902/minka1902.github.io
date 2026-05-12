import { cn } from '@/lib/utils';

export type BlockKind = 'base-pending' | 'base-completed' | 'standalone-log' | 'scheduled-log';

export interface StatusBadge {
  label: string;
  bg: string;
  fg: string;
}

const GUTTER_PX = 48;
const RIGHT_PX  = 8;

export interface SubLogChip {
  type: 'pee' | 'poop';
  icon: string;
}

interface Props {
  kind: BlockKind;
  icon: string;
  color: string;
  label: string;
  sublabel?: string;
  statusBadge?: StatusBadge;
  subLogs?: SubLogChip[];
  top: number;
  height: number;
  col?: number;
  totalCols?: number;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

export default function TimelineBlock({
  kind, icon, color, label, sublabel, statusBadge, subLogs,
  top, height, col = 0, totalCols = 1, onClick, draggable, onDragStart, onDragEnd,
}: Props) {
  const isPending = kind === 'base-pending' || kind === 'scheduled-log';

  const trackExpr = `(100% - ${GUTTER_PX + RIGHT_PX}px)`;
  const leftStyle  = `calc(${GUTTER_PX}px + ${col / totalCols} * ${trackExpr})`;
  const widthStyle = `calc(${trackExpr} / ${totalCols} - ${totalCols > 1 ? 2 : 0}px)`;

  return (
    <div
      className={cn(
        'absolute rounded-lg px-2 py-1 select-none',
        isPending ? 'opacity-60' : 'opacity-100',
        onClick && 'cursor-pointer hover:brightness-95 transition-[filter]',
        draggable && !onClick && 'cursor-grab active:cursor-grabbing',
      )}
      style={{
        top,
        height,
        left: leftStyle,
        width: widthStyle,
        backgroundColor: color + (isPending ? '10' : '1a'),
        border: `1.5px ${isPending ? 'dashed' : 'solid'} ${color}${isPending ? '40' : '70'}`,
      }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
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
          {subLogs && subLogs.length > 0 && (
            <span className="text-[11px] leading-none mt-0.5 opacity-80">
              {subLogs.map(s => s.icon).join('')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
