import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TRAINING_TYPES } from '@/lib/constants';
import { fmtDate } from '@/lib/utils';
import type { TrainingSession } from '@/types';

interface Props { session: TrainingSession }

export default function TrainingSessionCard({ session }: Props) {
  const typeLabel = TRAINING_TYPES.find(t => t.type === session.trainingType)?.label ?? session.trainingType;
  return (
    <Link to={`/training/${session.id}`}>
      <div className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3 hover:bg-muted/40 transition-colors group">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs shrink-0">{typeLabel}</Badge>
            {session.templateUsed && (
              <span className="text-xs text-muted-foreground">• from template</span>
            )}
          </div>
          <p className="text-sm font-medium truncate">{session.objective}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fmtDate(session.scheduledAt)} · {session.trainerName}
            {session.location && ` · ${session.location}`}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
      </div>
    </Link>
  );
}
