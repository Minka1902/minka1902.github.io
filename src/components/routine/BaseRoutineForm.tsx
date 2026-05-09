import { useState, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import { useBaseRoutine, makeSlotKey } from '@/hooks/useBaseRoutine';
import { ROUTINE_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { RoutineType } from '@/types';
import type { BaseRoutineSlots } from '@/hooks/useBaseRoutine';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SLOTS: string[] = [];
for (let h = 0; h < 24; h++) {
  SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

const DEFAULT_START = 12; // 06:00
const DEFAULT_END   = 44; // 22:00

const SCHEDULABLE = ROUTINE_TYPES.filter(r => r.type !== 'pee' && r.type !== 'poop' && r.type !== 'custom');

// 0 = Mon … 6 = Sun (matching DAYS order)
const todayDayIdx = () => {
  const d = new Date().getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
};

interface Props {
  dogId: string;
  onClose: () => void;
}

export default function BaseRoutineForm({ dogId, onClose }: Props) {
  const { slots: savedSlots, loading, save } = useBaseRoutine(dogId);
  const [draft, setDraft] = useState<BaseRoutineSlots | null>(null);
  const [showAllHours, setShowAllHours] = useState(false);
  const [pickerCell, setPickerCell] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const slots: BaseRoutineSlots = draft ?? savedSlots;
  const visibleSlots = showAllHours ? SLOTS : SLOTS.slice(DEFAULT_START, DEFAULT_END + 1);
  const currentDayIdx = todayDayIdx();

  const setSlot = useCallback((key: string, type: RoutineType | null) => {
    setDraft(prev => {
      const base = prev ?? savedSlots;
      const next = { ...base };
      if (type === null) delete next[key];
      else next[key] = type;
      return next;
    });
    setPickerCell(null);
  }, [savedSlots]);

  const handleSave = async () => {
    setSaving(true);
    await save(draft ?? savedSlots);
    setSaving(false);
    setDraft(null);
    onClose();
  };

  const typeMap = Object.fromEntries(ROUTINE_TYPES.map(r => [r.type, r]));

  if (loading) return (
    <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">Loading…</div>
  );

  const selectedRt = pickerCell ? (slots[pickerCell] ? typeMap[slots[pickerCell]] : null) : null;

  return (
    <div className="flex flex-col h-full" onClick={() => setPickerCell(null)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/50 shrink-0">
        <div className="flex-1">
          <h2 className="font-bold text-base" style={{ fontFamily: 'var(--font-heading)' }}>Weekly Base Routine</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Tap a cell to assign an activity</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 overflow-x-auto px-4 py-2 shrink-0 scrollbar-none border-b border-border/30">
        {SCHEDULABLE.map(rt => (
          <span key={rt.type} className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <span className="text-sm">{rt.icon}</span> {rt.label}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          {/* Day header */}
          <div className="flex sticky top-0 z-10 bg-card border-b border-border/50">
            <div className="w-14 shrink-0" />
            {DAYS.map((d, i) => (
              <div
                key={d}
                className={cn(
                  'w-10 text-center text-[10px] font-bold uppercase tracking-wider py-2 transition-colors',
                  i === currentDayIdx ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Time rows */}
          {visibleSlots.map(time => {
            const isHalfHour = time.endsWith(':30');
            return (
              <div key={time} className={cn('flex items-center border-b last:border-0', isHalfHour ? 'border-border/10' : 'border-border/25')}>
                <div className="w-14 shrink-0 px-2" style={{ height: 44 }}>
                  {!isHalfHour && (
                    <span className="text-[10px] text-muted-foreground/60 tabular-nums leading-none" style={{ lineHeight: '44px' }}>
                      {time}
                    </span>
                  )}
                </div>
                {DAYS.map((_, dayIdx) => {
                  const key = makeSlotKey(dayIdx, time);
                  const assigned = slots[key];
                  const rt = assigned ? typeMap[assigned] : null;
                  const isSelected = pickerCell === key;
                  const isToday = dayIdx === currentDayIdx;

                  return (
                    <div
                      key={dayIdx}
                      className={cn(
                        'relative w-10 flex items-center justify-center cursor-pointer transition-colors',
                        isToday && 'bg-primary/3',
                        isSelected && 'bg-primary/8',
                      )}
                      style={{ height: 44 }}
                      onClick={e => { e.stopPropagation(); setPickerCell(prev => prev === key ? null : key); }}
                    >
                      {rt ? (
                        <div
                          className={cn(
                            'h-8 w-8 rounded-lg flex items-center justify-center text-base transition-all',
                            isSelected ? 'scale-110 ring-2 ring-primary/40' : 'hover:scale-105',
                          )}
                          style={{ backgroundColor: rt.color + '22', border: `1.5px solid ${rt.color}50` }}
                          title={rt.label}
                        >
                          {rt.icon}
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'h-8 w-8 rounded-lg border transition-all',
                            isSelected
                              ? 'border-primary/50 bg-primary/8'
                              : 'border-dashed border-border/30 hover:border-border/60 hover:bg-muted/30',
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer — type picker when cell selected, else controls */}
      <div className="shrink-0 border-t border-border/50">
        {pickerCell ? (
          <div className="px-3 py-3" onClick={e => e.stopPropagation()}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
              Assign activity
            </p>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {SCHEDULABLE.map(rt => (
                <button
                  key={rt.type}
                  onClick={() => setSlot(pickerCell, rt.type)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl border whitespace-nowrap transition-all shrink-0',
                    selectedRt?.type === rt.type
                      ? 'border-primary/50'
                      : 'border-border/50 hover:border-border',
                  )}
                  style={selectedRt?.type === rt.type ? { backgroundColor: rt.color + '14' } : undefined}
                >
                  <span className="text-base">{rt.icon}</span>
                  <span className="text-xs font-medium">{rt.label}</span>
                </button>
              ))}
              {slots[pickerCell] && (
                <button
                  onClick={() => setSlot(pickerCell, null)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/50 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 whitespace-nowrap transition-all shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Clear</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 flex items-center gap-2">
            <button
              onClick={() => setShowAllHours(p => !p)}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              {showAllHours ? 'Show 06:00–22:00 only' : 'Show all 24 hours'}
            </button>
            <div className="flex-1" />
            {draft && (
              <button
                onClick={() => setDraft(null)}
                className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                Reset
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !draft}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
              style={{ backgroundColor: 'oklch(0.64 0.168 48)', color: 'oklch(0.99 0 0)' }}
            >
              <Check className="h-3.5 w-3.5" />
              {saving ? 'Saving…' : 'Save routine'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
