import { useParams, Navigate } from 'react-router-dom';
import { useDog } from '@/contexts/DogContext';
import { useTraining } from '@/hooks/useTraining';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TRAINING_TYPES } from '@/lib/constants';
import { fmtDate, fmtTime } from '@/lib/utils';

export default function TrainingSessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { activeDog } = useDog();
  const { sessions } = useTraining(activeDog?.id ?? '');
  const session = sessions.find(s => s.id === sessionId);

  if (!activeDog || !session) return <Navigate to="/training" replace />;

  const typeLabel = TRAINING_TYPES.find(t => t.type === session.trainingType)?.label ?? session.trainingType;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold flex-1">{typeLabel}</h1>
        <Badge variant="outline">{fmtDate(session.scheduledAt)}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Session Details</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium">Objective</p>
            <p className="text-muted-foreground">{session.objective}</p>
          </div>
          {session.location && (
            <div>
              <p className="font-medium">Location</p>
              <p className="text-muted-foreground">{session.location}</p>
            </div>
          )}
          <div>
            <p className="font-medium">Trainer</p>
            <p className="text-muted-foreground">{session.trainerName}</p>
          </div>
          <div>
            <p className="font-medium">Logged</p>
            <p className="text-muted-foreground">{fmtTime(session.createdAt)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
