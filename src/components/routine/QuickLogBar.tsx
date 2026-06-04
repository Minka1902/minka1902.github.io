import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoutine } from '@/hooks/useRoutine';
import { useDog } from '@/contexts/DogContext';
import { ROUTINE_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import DogSelectForWalkDialog from '@/components/walk/DogSelectForWalkDialog';
import type { RoutineType } from '@/types';

export default function QuickLogBar() {
  const navigate = useNavigate();
  const { activeDog, dogs } = useDog();
  const { logRoutine } = useRoutine(activeDog?.id ?? '');
  const [logging, setLogging] = useState<RoutineType | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [savingCustom, setSavingCustom] = useState(false);
  const [showWalkPicker, setShowWalkPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (customMode) inputRef.current?.focus();
  }, [customMode]);

  const handleLog = async (type: RoutineType) => {
    if (!activeDog) return;
    // Starting a walk: when there's more than one dog, ask who's coming first.
    if (type === 'walk') {
      if (dogs.length > 1) setShowWalkPicker(true);
      else navigate('/walk/active', { state: { dogIds: [activeDog.id] } });
      return;
    }
    if (type === 'custom') { setCustomMode(true); return; }
    if (logging) return;
    setLogging(type);
    await logRoutine(type);
    setLogging(null);
  };

  const handleSaveCustom = async () => {
    const label = customLabel.trim();
    if (!label || !activeDog) return;
    setSavingCustom(true);
    await logRoutine('custom', { customLabel: label });
    setCustomLabel('');
    setCustomMode(false);
    setSavingCustom(false);
  };

  const handleCancelCustom = () => {
    setCustomLabel('');
    setCustomMode(false);
  };

  if (customMode) {
    return (
      <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2 shadow-sm">
        <span className="text-xl shrink-0">✏️</span>
        <input
          ref={inputRef}
          value={customLabel}
          onChange={e => setCustomLabel(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSaveCustom();
            if (e.key === 'Escape') handleCancelCustom();
          }}
          placeholder="What happened? (e.g. grooming, vet visit…)"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          disabled={savingCustom}
        />
        <button
          onClick={handleCancelCustom}
          className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          onClick={handleSaveCustom}
          disabled={!customLabel.trim() || savingCustom}
          className={cn(
            'shrink-0 p-1 rounded-md transition-colors',
            customLabel.trim()
              ? 'text-primary hover:text-primary/80'
              : 'text-muted-foreground/40 cursor-not-allowed',
          )}
          aria-label="Save"
        >
          <Check className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <>
    {showWalkPicker && <DogSelectForWalkDialog onClose={() => setShowWalkPicker(false)} />}
    <div className="flex flex-wrap justify-center gap-2">
      {ROUTINE_TYPES.map(({ type, label, icon }) => (
        <button
          key={type}
          disabled={logging === type}
          onClick={() => handleLog(type)}
          aria-label={label}
          className={cn(
            'flex flex-col items-center gap-1.5 rounded-xl border bg-background py-3 px-2 text-center transition-all min-w-[60px]',
            'hover:bg-muted hover:border-border hover:scale-105 active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100',
            type === 'walk' && 'border-primary/30 bg-primary/5 hover:bg-primary/10',
            logging === type && 'bg-muted',
          )}
        >
          <span className="text-2xl">{icon}</span>
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </button>
      ))}
    </div>
    </>
  );
}
