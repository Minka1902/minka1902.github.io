import { useState } from 'react';
import { useRoutine } from '@/hooks/useRoutine';
import { useDog } from '@/contexts/DogContext';
import { ROUTINE_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';
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
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {ROUTINE_TYPES.map(({ type, label, icon }) => (
        <button
          key={type}
          disabled={logging === type}
          onClick={() => handleLog(type)}
          aria-label={label}
          className={cn(
            'flex flex-col items-center gap-1.5 rounded-xl border bg-background py-3 px-2 text-center transition-all',
            'hover:bg-muted hover:border-border hover:scale-105 active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100',
            logging === type && 'bg-muted',
          )}
        >
          <span className="text-2xl">{icon}</span>
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </button>
      ))}
    </div>
  );
}
