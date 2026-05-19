import { useState } from 'react';
import { X, Check, Clock } from 'lucide-react';
import { useHumans } from '@/hooks/useHumans';
import { useAuth } from '@/hooks/useAuth';
import { ROUTINE_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { RoutineType } from '@/types';

const SCHEDULABLE = ROUTINE_TYPES.filter(r => r.type !== 'custom');

interface SaveParams {
  type: RoutineType;
  scheduledFor: number;
  assignedTo: string;
  assignedToName: string;
  reason?: string;
}

interface Props {
  dogId: string;
  onSave: (params: SaveParams) => Promise<void>;
  onClose: () => void;
  initialDate?: Date | null;
}

export default function ScheduleLogSheet({ dogId, onSave, onClose, initialDate }: Props) {
  const { user } = useAuth();
  const { humans } = useHumans(dogId);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  const defaultDateStr = initialDate ? initialDate.toISOString().split('T')[0] : tomorrowStr;
  const defaultTimeStr = initialDate
    ? `${String(initialDate.getHours()).padStart(2, '0')}:${String(initialDate.getMinutes()).padStart(2, '0')}`
    : '08:00';

  const [type, setType] = useState<RoutineType>('eat');
  const [date, setDate] = useState(defaultDateStr);
  const [time, setTime] = useState(defaultTimeStr);
  const [assignedTo, setAssignedTo] = useState(user?.uid ?? '');
  const [assignedToName, setAssignedToName] = useState(user?.displayName ?? 'Me');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [dateError, setDateError] = useState('');

  const allPeople = [
    { userId: user?.uid ?? '', displayName: user?.displayName ?? 'Me' },
    ...humans.filter(h => h.userId !== user?.uid),
  ];

  const handleSave = async () => {
    const dt = new Date(`${date}T${time}`);
    if (isNaN(dt.getTime())) return;
    const scheduledFor = dt.getTime();
    if (scheduledFor <= Date.now()) {
      setDateError('Must be a future date and time');
      return;
    }
    setDateError('');
    setSaving(true);
    await onSave({
      type,
      scheduledFor,
      assignedTo,
      assignedToName,
      reason: reason.trim() || undefined,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/50 shrink-0">
        <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'oklch(0.64 0.168 48 / 0.12)' }}>
          <Clock className="h-4 w-4" style={{ color: 'oklch(0.64 0.168 48)' }} />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-base" style={{ fontFamily: 'var(--font-heading)' }}>Schedule a task</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Assign a future task to your care team</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* What */}
        <section className="px-4 pt-5 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">What</p>
          <div className="grid grid-cols-3 gap-2">
            {SCHEDULABLE.map(rt => (
              <button
                key={rt.type}
                onClick={() => setType(rt.type)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all',
                  type === rt.type
                    ? 'border-primary/50'
                    : 'border-border/50 hover:border-border',
                )}
                style={type === rt.type ? { backgroundColor: rt.color + '14' } : undefined}
              >
                <span className="text-lg leading-none">{rt.icon}</span>
                <span className={cn('text-xs font-medium', type === rt.type ? 'text-foreground' : 'text-muted-foreground')}>
                  {rt.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* When */}
        <section className="px-4 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">When</p>
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              min={initialDate && initialDate < new Date(todayStr) ? undefined : todayStr}
              onChange={e => { setDate(e.target.value); setDateError(''); }}
              className="flex-1 px-3 py-2.5 rounded-xl border border-border/60 bg-background text-sm outline-none focus:border-primary transition-colors"
            />
            <input
              type="time"
              value={time}
              onChange={e => { setTime(e.target.value); setDateError(''); }}
              className="px-3 py-2.5 rounded-xl border border-border/60 bg-background text-sm outline-none focus:border-primary transition-colors w-28"
            />
          </div>
          {dateError && (
            <p className="text-xs text-destructive mt-1.5">{dateError}</p>
          )}
        </section>

        {/* Who */}
        <section className="px-4 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">Assigned to</p>
          <div className="flex flex-col gap-1.5">
            {allPeople.map(p => {
              const isSelected = assignedTo === p.userId;
              return (
                <button
                  key={p.userId}
                  onClick={() => { setAssignedTo(p.userId); setAssignedToName(p.displayName); }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                    isSelected
                      ? 'border-primary/50 bg-primary/6'
                      : 'border-border/50 hover:border-border',
                  )}
                >
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
                    style={isSelected
                      ? { backgroundColor: 'oklch(0.64 0.168 48)', color: 'oklch(0.99 0 0)' }
                      : { backgroundColor: 'oklch(0.93 0.010 72)', color: 'oklch(0.50 0.022 52)' }
                    }
                  >
                    {(p.displayName?.[0] ?? '?').toUpperCase()}
                  </div>
                  <span className={cn('text-sm font-medium', isSelected ? 'text-foreground' : 'text-muted-foreground')}>
                    {p.userId === user?.uid ? `${p.displayName} (you)` : p.displayName}
                  </span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 ml-auto shrink-0" style={{ color: 'oklch(0.64 0.168 48)' }} />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Why */}
        <section className="px-4 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">
            Reason{' '}
            <span className="normal-case font-normal opacity-60">optional</span>
          </p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. I'll be travelling, please feed at 8am"
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-background text-sm outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground/50"
          />
        </section>
      </div>

      <div className="shrink-0 px-4 py-3 border-t border-border/50 flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !date || !time || !assignedTo}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
          style={{ backgroundColor: 'oklch(0.64 0.168 48)', color: 'oklch(0.99 0 0)' }}
        >
          <Check className="h-3.5 w-3.5" />
          {saving ? 'Scheduling…' : 'Schedule task'}
        </button>
      </div>
    </div>
  );
}
