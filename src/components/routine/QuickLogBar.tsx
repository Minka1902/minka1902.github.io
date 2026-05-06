import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRoutine } from '@/hooks/useRoutine';
import { useDog } from '@/contexts/DogContext';
import { ROUTINE_TYPES } from '@/lib/constants';
import type { RoutineType } from '@/types';

export default function QuickLogBar() {
  const { activeDog } = useDog();
  const { logRoutine } = useRoutine(activeDog?.id ?? '');
  const [logging, setLogging] = useState<RoutineType | null>(null);

  const handleLog = async (type: RoutineType) => {
    if (!activeDog || logging) return;
    setLogging(type);
    await logRoutine(type);
    setLogging(null);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ROUTINE_TYPES.map(({ type, label, icon }) => (
        <Button
          key={type}
          variant="outline"
          size="sm"
          disabled={logging === type}
          onClick={() => handleLog(type)}
          aria-label={label}
        >
          <span>{icon}</span>
          <span className="ml-1">{label}</span>
        </Button>
      ))}
    </div>
  );
}
