import { useState } from 'react';
import { X } from 'lucide-react';
import { useBaseRoutine, makeSlotKey } from '@/hooks/useBaseRoutine';
import { useRoutine } from '@/hooks/useRoutine';
import { QUICK_LOG_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { RoutineType } from '@/types';

interface Props {
  anchorY: number;        // viewport Y to anchor the popover near
  clickedTimeStr: string; // e.g. "07:30"
  dogId: string;
  dayIdx: number;         // 0=Mon…6=Sun for base routine slot key
  onClose: () => void;
}

export default function QuickAddPopover({ anchorY, clickedTimeStr, dogId, dayIdx, onClose }: Props) {
  const [selectedType, setSelectedType] = useState<RoutineType | null>(null);
  const [notes, setNotes]               = useState('');
  const [addToBase, setAddToBase]       = useState(false);
  const [saving, setSaving]             = useState(false);

  const { logRoutine }                        = useRoutine(dogId);
  const { save: saveBase, slots: baseSlots }  = useBaseRoutine(dogId);

  const handleSave = async () => {
    if (!selectedType) return;
    setSaving(true);
    try {
      await logRoutine(selectedType, notes ? { notes } : {});
      if (addToBase) {
        const key = makeSlotKey(dayIdx, clickedTimeStr);
        await saveBase({ ...baseSlots, [key]: selectedType });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // Keep popover within viewport height
  const top = Math.max(8, Math.min(anchorY, window.innerHeight - 280));

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 left-1/2 -translate-x-1/2 w-72 bg-card border border-border rounded-2xl shadow-xl p-4"
        style={{ top }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Log at {clickedTimeStr}</p>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {QUICK_LOG_TYPES.map(({ type, icon, color, label }) => (
            <button
              key={type}
              onClick={() => setSelectedType(type as RoutineType)}
              aria-label={label}
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-xl border text-lg transition-all',
                selectedType === type
                  ? 'ring-2 ring-offset-1 ring-current'
                  : 'border-border/50 opacity-60 hover:opacity-100',
              )}
              style={selectedType === type
                ? { backgroundColor: color + '18', borderColor: color, color }
                : undefined
              }
            >
              {icon}
            </button>
          ))}
        </div>

        <input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="w-full text-xs bg-muted/40 border border-border/40 rounded-lg px-3 py-2 mb-3 outline-none focus:border-primary/50 transition-colors"
        />

        <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={addToBase}
            onChange={e => setAddToBase(e.target.checked)}
            className="h-3.5 w-3.5 rounded accent-primary"
          />
          <span className="text-xs text-muted-foreground">Add to base routine</span>
        </label>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium border border-border/50 text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedType || saving}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            style={{ backgroundColor: 'oklch(0.64 0.168 48)', color: 'oklch(0.99 0 0)' }}
          >
            {saving ? '…' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
}
