import { useState, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import { useBaseRoutine, makeSlotKey } from '@/hooks/useBaseRoutine';
import { ROUTINE_TYPES } from '@/lib/constants';
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

// Pee/poop can't be scheduled — exclude from base routine picker
const SCHEDULABLE = ROUTINE_TYPES.filter(r => r.type !== 'pee' && r.type !== 'poop' && r.type !== 'custom');

interface Props {
  dogId: string;
  onClose: () => void;
}

function TypePicker({ onSelect, onClear }: { onSelect: (t: RoutineType) => void; onClear: () => void }) {
  return (
    <div className="absolute z-50 bottom-full mb-1 left-1/2 -translate-x-1/2 bg-card border rounded-xl shadow-xl p-2 flex gap-1.5 whitespace-nowrap">
      {SCHEDULABLE.map(rt => (
        <button
          key={rt.type}
          onClick={() => onSelect(rt.type)}
          className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
          title={rt.label}
        >
          <span className="text-base leading-none">{rt.icon}</span>
          <span className="text-[9px] text-muted-foreground">{rt.label}</span>
        </button>
      ))}
      <button
        onClick={onClear}
        className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        title="Clear"
      >
        <X className="h-4 w-4" />
        <span className="text-[9px]">Clear</span>
      </button>
    </div>
  );
}

export default function BaseRoutineForm({ dogId, onClose }: Props) {
  const { slots: savedSlots, loading, save } = useBaseRoutine(dogId);
  const [draft, setDraft] = useState<BaseRoutineSlots | null>(null);
  const [showAllHours, setShowAllHours] = useState(false);
  const [pickerCell, setPickerCell] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const slots: BaseRoutineSlots = draft ?? savedSlots;
  const visibleSlots = showAllHours ? SLOTS : SLOTS.slice(DEFAULT_START, DEFAULT_END + 1);

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
            {DAYS.map(d => (
              <div key={d} className="w-10 text-center text-[10px] font-bold uppercase text-muted-foreground py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Time rows */}
          {visibleSlots.map(time => (
            <div key={time} className="flex items-center border-b border-border/20 last:border-0">
              <div className="w-14 shrink-0 text-[10px] text-muted-foreground/60 tabular-nums px-2 py-1">
                {time}
              </div>
              {DAYS.map((_, dayIdx) => {
                const key = makeSlotKey(dayIdx, time);
                const assigned = slots[key];
                const rt = assigned ? typeMap[assigned] : null;
                const isOpen = pickerCell === key;

                return (
                  <div
                    key={dayIdx}
                    className="relative w-10 flex items-center justify-center"
                    style={{ height: 28 }}
                    onClick={e => { e.stopPropagation(); setPickerCell(prev => prev === key ? null : key); }}
                  >
                    {rt ? (
                      <div
                        className="h-6 w-6 rounded-md flex items-center justify-center text-sm cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: rt.color + '25', border: `1.5px solid ${rt.color}50` }}
                        title={rt.label}
                      >
                        {rt.icon}
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-md border border-dashed border-border/40 hover:border-border hover:bg-muted/40 cursor-pointer transition-colors" />
                    )}
                    {isOpen && (
                      <TypePicker
                        onSelect={type => setSlot(key, type)}
                        onClear={() => setSlot(key, null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-3 border-t border-border/50 flex items-center gap-2">
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
          style={{ backgroundColor: '#F59E0B', color: '#1a1612' }}
        >
          <Check className="h-3.5 w-3.5" />
          {saving ? 'Saving…' : 'Save routine'}
        </button>
      </div>
    </div>
  );
}
