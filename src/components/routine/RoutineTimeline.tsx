import { useRoutine } from '@/hooks/useRoutine';
import RoutineLogItem from './RoutineLogItem';

interface Props {
  dogId: string;
  canDelete?: boolean;
}

export default function RoutineTimeline({ dogId, canDelete }: Props) {
  const { todayLogs, deleteLog } = useRoutine(dogId);

  if (todayLogs.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">No activity logged today.</p>;
  }

  return (
    <div className="divide-y">
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
