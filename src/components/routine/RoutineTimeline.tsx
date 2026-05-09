import { useRoutine } from '@/hooks/useRoutine';
import RoutineLogItem from './RoutineLogItem';

interface Props {
  dogId: string;
  dogName?: string;
  canDelete?: boolean;
}

export default function RoutineTimeline({ dogId, dogName, canDelete }: Props) {
  const { todayLogs, deleteLog } = useRoutine(dogId);

  if (todayLogs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Nothing logged yet{dogName ? ` for ${dogName}` : ''} today.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border/40">
      {todayLogs.map(log => (
        <RoutineLogItem
          key={log.id}
          log={log}
          onDelete={canDelete ? deleteLog : undefined}
        />
      ))}
    </div>
  );
}
