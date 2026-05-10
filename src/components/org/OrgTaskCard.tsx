import { Check, Trash2, Clock, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fmtTime, fmtDate } from '@/lib/utils';
import type { OrgTask, OrgTaskStatus } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  grooming: 'Grooming', bath: 'Bath', nail_trim: 'Nail Trim', dental: 'Dental',
  ear_clean: 'Ear Clean', training: 'Training', walk: 'Walk', feeding: 'Feeding',
  medication: 'Medication', vet_visit: 'Vet Visit', behavior_check: 'Behavior Check',
  socialization: 'Socialization', other: 'Other',
};

const STATUS_STYLES: Record<OrgTaskStatus, string> = {
  pending:     'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  done:        'bg-green-100 text-green-700 border-green-200',
  cancelled:   'bg-red-100 text-red-600 border-red-200',
};

interface Props {
  task: OrgTask;
  canManage?: boolean;
  isMine?: boolean;
  onStatusChange?: (taskId: string, status: OrgTaskStatus) => void;
  onDelete?: (taskId: string) => void;
}

export default function OrgTaskCard({ task, canManage, isMine, onStatusChange, onDelete }: Props) {
  const overdue = task.dueAt && task.dueAt < Date.now() && task.status === 'pending';

  return (
    <div className={`rounded-xl border bg-card px-4 py-3 space-y-2 ${overdue ? 'border-red-200 bg-red-50/30' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Status toggle */}
        {(canManage || isMine) && task.status !== 'done' && task.status !== 'cancelled' && (
          <button
            onClick={() => onStatusChange?.(task.id, task.status === 'pending' ? 'in_progress' : 'done')}
            className={`mt-0.5 h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
              task.status === 'in_progress'
                ? 'border-blue-400 bg-blue-100 text-blue-600'
                : 'border-muted-foreground/30 hover:border-primary'
            }`}
            title={task.status === 'pending' ? 'Mark in progress' : 'Mark done'}
          >
            {task.status === 'in_progress' && <ChevronRight className="h-3 w-3" />}
          </button>
        )}
        {task.status === 'done' && (
          <div className="mt-0.5 h-5 w-5 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center shrink-0">
            <Check className="h-3 w-3 text-green-600" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-semibold truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </p>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {TYPE_LABELS[task.type] ?? task.type}
            </Badge>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_STYLES[task.status]}`}>
              {task.status.replace('_', ' ')}
            </Badge>
          </div>

          <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-muted-foreground">
            <span className="capitalize">🐾 {task.dogName}</span>
            <span>→ {task.assignedToName}</span>
            {task.dueAt && (
              <span className={`flex items-center gap-0.5 ${overdue ? 'text-red-600 font-medium' : ''}`}>
                <Clock className="h-3 w-3" />
                {fmtDate(task.dueAt)} {fmtTime(task.dueAt)}
              </span>
            )}
          </div>

          {task.notes && (
            <p className="text-xs text-muted-foreground mt-1 italic">{task.notes}</p>
          )}
          {task.status === 'done' && task.completionNotes && (
            <p className="text-xs text-green-700 mt-1">✓ {task.completionNotes}</p>
          )}
          {task.status === 'done' && task.completedByName && (
            <p className="text-[10px] text-muted-foreground mt-0.5">Completed by {task.completedByName}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {(canManage || isMine) && task.status === 'in_progress' && (
            <Button
              size="sm"
              className="h-7 gap-1 text-xs bg-green-600 hover:bg-green-700"
              onClick={() => onStatusChange?.(task.id, 'done')}
            >
              <Check className="h-3 w-3" />
              Done
            </Button>
          )}
          {canManage && onDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
              title="Delete task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
