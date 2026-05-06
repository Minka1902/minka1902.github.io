import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TRAINING_TYPES } from '@/lib/constants';
import { fmtDate } from '@/lib/utils';
import type { TrainingSession } from '@/types';

interface Props { session: TrainingSession }

export default function TrainingSessionCard({ session }: Props) {
  const typeLabel = TRAINING_TYPES.find(t => t.type === session.trainingType)?.label ?? session.trainingType;
  return (
    <Link to={`/training/${session.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{typeLabel}</Badge>
              {session.templateUsed && <Badge variant="secondary" className="text-xs">Template</Badge>}
            </div>
            <p className="font-medium text-sm">{session.objective}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {fmtDate(session.scheduledAt)} · {session.trainerName}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
