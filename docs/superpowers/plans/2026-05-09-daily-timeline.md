# Daily Timeline View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the day activity list on RoutinePage with a Google Calendar-style scrollable vertical timeline (6:00–22:00, customizable) showing base routine slots, routine logs, scheduled logs, and medical events unified on a time axis.

**Architecture:** Pure utility functions in `timelineUtils.ts` handle time math and slot↔log matching. Four new components (AllDayStrip, TimelineBlock, QuickAddPopover, DayTimeline) are assembled bottom-up and dropped into RoutinePage replacing the existing day list card. Drag-and-drop uses the HTML5 DnD API and writes directly to Firestore on drop.

**Tech Stack:** React 18, TypeScript, Vitest + @testing-library/react, Firebase/Firestore, Tailwind CSS, date-fns, lucide-react

---

## File Map

**New files:**
- `src/lib/timelineUtils.ts` — pure functions: time math, slot↔log matching, localStorage settings
- `src/lib/__tests__/timelineUtils.test.ts` — unit tests for all pure functions
- `src/components/routine/AllDayStrip.tsx` — medical events all-day pill strip above timeline
- `src/components/routine/TimelineBlock.tsx` — single event block (all 4 kinds)
- `src/components/routine/QuickAddPopover.tsx` — double-click log popover with "add to base routine" toggle
- `src/components/routine/DayTimeline.tsx` — main orchestrator: matching, grid, blocks, drag-and-drop, scroll fades, settings

**Modified files:**
- `src/pages/routine/RoutinePage.tsx` — swap day activity list card for `<DayTimeline />`

---

## Task 1: Pure utility functions

**Files:**
- Create: `src/lib/timelineUtils.ts`
- Create: `src/lib/__tests__/timelineUtils.test.ts`

- [ ] **Step 1: Create `src/lib/timelineUtils.ts`**

```ts
import type { RoutineType } from '@/types';
import type { RoutineLog } from '@/types';
import type { BaseRoutineSlots } from '@/hooks/useBaseRoutine';

export const PX_PER_HOUR = 64;
const MATCH_WINDOW_MS = 90 * 60 * 1000; // ±90 min

export interface SlotEvent {
  slotKey: string;              // e.g. "0_07:00"
  type: RoutineType;
  slotTimeStr: string;          // "07:00"
  minutesFromMidnight: number;
  log?: RoutineLog;             // matched log if completed
}

export interface TimeRange {
  startHour: number;
  endHour: number;
}

const STORAGE_KEY = 'routineTimeRange';

export function timeStrToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToPx(minutes: number, startHour: number): number {
  return (minutes - startHour * 60) * (PX_PER_HOUR / 60);
}

export function pxToTimeStr(px: number, startHour: number): string {
  const rawMin = Math.round(px / (PX_PER_HOUR / 60)) + startHour * 60;
  const clamped = Math.max(0, Math.min(23 * 60 + 30, rawMin));
  const snapped = Math.round(clamped / 30) * 30; // snap to nearest 30 min
  const h = Math.floor(snapped / 60);
  const m = snapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function loadTimeRange(): TimeRange {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TimeRange;
      if (typeof parsed.startHour === 'number' && typeof parsed.endHour === 'number') {
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return { startHour: 6, endHour: 22 };
}

export function saveTimeRange(range: TimeRange): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(range));
}

/**
 * Match base routine slots for the given weekday against actual routine logs.
 * dayIdx: 0=Mon…6=Sun (matches BaseRoutineForm convention)
 * dayStartMs: local midnight of the selected date (new Date(date).setHours(0,0,0,0))
 */
export function matchSlotsToLogs(
  baseSlots: BaseRoutineSlots,
  logs: RoutineLog[],
  dayIdx: number,
  dayStartMs: number,
): { slotEvents: SlotEvent[]; standaloneLogs: RoutineLog[] } {
  const slotEvents: SlotEvent[] = Object.entries(baseSlots)
    .filter(([key]) => key.startsWith(`${dayIdx}_`))
    .map(([key, type]) => {
      const slotTimeStr = key.slice(key.indexOf('_') + 1);
      return {
        slotKey: key,
        type,
        slotTimeStr,
        minutesFromMidnight: timeStrToMinutes(slotTimeStr),
      };
    })
    .sort((a, b) => a.minutesFromMidnight - b.minutesFromMidnight);

  const pool = [...logs];

  for (const slot of slotEvents) {
    const slotMs = dayStartMs + slot.minutesFromMidnight * 60_000;
    const candidates = pool
      .map((log, idx) => ({ log, idx, diff: Math.abs(log.timestamp - slotMs) }))
      .filter(({ log, diff }) => log.type === slot.type && diff <= MATCH_WINDOW_MS)
      .sort((a, b) => a.diff - b.diff);

    if (candidates.length > 0) {
      slot.log = candidates[0].log;
      pool.splice(candidates[0].idx, 1);
    }
  }

  return { slotEvents, standaloneLogs: pool };
}
```

- [ ] **Step 2: Create `src/lib/__tests__/timelineUtils.test.ts`**

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  timeStrToMinutes, minutesToPx, pxToTimeStr,
  loadTimeRange, saveTimeRange, matchSlotsToLogs, PX_PER_HOUR,
} from '../timelineUtils';
import type { RoutineLog } from '@/types';

const makeLog = (id: string, type: string, timestamp: number): RoutineLog =>
  ({ id, type, timestamp } as unknown as RoutineLog);

describe('timeStrToMinutes', () => {
  it('converts "06:00"', () => expect(timeStrToMinutes('06:00')).toBe(360));
  it('converts "07:30"', () => expect(timeStrToMinutes('07:30')).toBe(450));
  it('converts "22:00"', () => expect(timeStrToMinutes('22:00')).toBe(1320));
});

describe('minutesToPx', () => {
  it('returns 0 at startHour', () => expect(minutesToPx(360, 6)).toBe(0));
  it('returns PX_PER_HOUR at startHour + 1h', () => expect(minutesToPx(420, 6)).toBe(PX_PER_HOUR));
  it('returns PX_PER_HOUR/2 at startHour + 30m', () => expect(minutesToPx(390, 6)).toBe(PX_PER_HOUR / 2));
});

describe('pxToTimeStr', () => {
  it('returns startHour for px=0', () => expect(pxToTimeStr(0, 6)).toBe('06:00'));
  // px=20 → rawMin ≈ 19 → +360 = 379 → snap to 390 → "06:30"
  it('snaps to 30-min intervals', () => expect(pxToTimeStr(20, 6)).toBe('06:30'));
  it('returns "07:00" for one full hour', () => expect(pxToTimeStr(PX_PER_HOUR, 6)).toBe('07:00'));
});

describe('loadTimeRange / saveTimeRange', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('defaults to 6–22', () => expect(loadTimeRange()).toEqual({ startHour: 6, endHour: 22 }));
  it('round-trips saved values', () => {
    saveTimeRange({ startHour: 7, endHour: 21 });
    expect(loadTimeRange()).toEqual({ startHour: 7, endHour: 21 });
  });
  it('returns defaults on corrupt data', () => {
    localStorage.setItem('routineTimeRange', 'not-json');
    expect(loadTimeRange()).toEqual({ startHour: 6, endHour: 22 });
  });
});

describe('matchSlotsToLogs', () => {
  // 2024-01-15 is a Monday → dayIdx 0
  const DAY_START = new Date(2024, 0, 15, 0, 0, 0, 0).getTime();
  const IDX = 0;

  it('empty inputs → empty outputs', () => {
    const { slotEvents, standaloneLogs } = matchSlotsToLogs({}, [], IDX, DAY_START);
    expect(slotEvents).toHaveLength(0);
    expect(standaloneLogs).toHaveLength(0);
  });

  it('slot stays pending when no log exists', () => {
    const { slotEvents, standaloneLogs } = matchSlotsToLogs({ '0_07:00': 'walk' }, [], IDX, DAY_START);
    expect(slotEvents[0].log).toBeUndefined();
    expect(standaloneLogs).toHaveLength(0);
  });

  it('matches a log within ±90 min', () => {
    // slot at 7:00, log at 7:30 → 30 min diff → match
    const log = makeLog('l1', 'walk', DAY_START + 7.5 * 3_600_000);
    const { slotEvents, standaloneLogs } = matchSlotsToLogs({ '0_07:00': 'walk' }, [log], IDX, DAY_START);
    expect(slotEvents[0].log).toBe(log);
    expect(standaloneLogs).toHaveLength(0);
  });

  it('does not match a log outside ±90 min', () => {
    // slot at 7:00, log at 10:00 → 180 min diff → no match
    const log = makeLog('l1', 'walk', DAY_START + 10 * 3_600_000);
    const { slotEvents, standaloneLogs } = matchSlotsToLogs({ '0_07:00': 'walk' }, [log], IDX, DAY_START);
    expect(slotEvents[0].log).toBeUndefined();
    expect(standaloneLogs).toHaveLength(1);
  });

  it('does not match a log of a different type', () => {
    const log = makeLog('l1', 'eat', DAY_START + 7 * 3_600_000);
    const { slotEvents, standaloneLogs } = matchSlotsToLogs({ '0_07:00': 'walk' }, [log], IDX, DAY_START);
    expect(slotEvents[0].log).toBeUndefined();
    expect(standaloneLogs).toHaveLength(1);
  });

  it('nearest log wins when multiple candidates exist', () => {
    const logFar  = makeLog('far',  'walk', DAY_START + 8 * 3_600_000);   // 60 min away
    const logNear = makeLog('near', 'walk', DAY_START + 7.1 * 3_600_000); // 6 min away
    const { slotEvents } = matchSlotsToLogs({ '0_07:00': 'walk' }, [logFar, logNear], IDX, DAY_START);
    expect(slotEvents[0].log?.id).toBe('near');
  });

  it('each log can match at most one slot', () => {
    const log = makeLog('l1', 'walk', DAY_START + 7 * 3_600_000);
    const { slotEvents } = matchSlotsToLogs(
      { '0_07:00': 'walk', '0_07:30': 'walk' },
      [log], IDX, DAY_START,
    );
    expect(slotEvents.filter(s => s.log)).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Run tests**

```
npx vitest run src/lib/__tests__/timelineUtils.test.ts
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/timelineUtils.ts src/lib/__tests__/timelineUtils.test.ts
git commit -m "feat: add timeline utility functions (time math, slot matching, range settings)"
```

---

## Task 2: AllDayStrip component

**Files:**
- Create: `src/components/routine/AllDayStrip.tsx`
- Create: `src/components/routine/__tests__/AllDayStrip.test.tsx`

- [ ] **Step 1: Create `src/components/routine/AllDayStrip.tsx`**

```tsx
import { MEDICAL_CATEGORY_META } from '@/lib/constants';
import type { MedicalCalendarEvent } from '@/hooks/useMedical';

interface Props {
  events: MedicalCalendarEvent[];
}

export default function AllDayStrip({ events }: Props) {
  if (events.length === 0) return null;
  return (
    <div className="flex gap-1.5 flex-wrap px-3 py-2 border-b border-border/30 bg-muted/20 shrink-0">
      {events.map((evt, i) => {
        const meta = MEDICAL_CATEGORY_META[evt.record.category] ?? { icon: '🏥', color: '#6366F1' };
        return (
          <span
            key={`${evt.record.id}-${evt.eventType}-${i}`}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
            style={{
              backgroundColor: meta.color + '18',
              color: meta.color,
              border: `1px solid ${meta.color}30`,
            }}
          >
            {meta.icon} {evt.record.title}
          </span>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/routine/__tests__/AllDayStrip.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import AllDayStrip from '../AllDayStrip';
import type { MedicalCalendarEvent } from '@/hooks/useMedical';

const makeEvt = (id: string, title: string): MedicalCalendarEvent => ({
  eventType: 'due',
  eventDate: Date.now(),
  record: { id, title, category: 'vaccination' } as any,
});

it('renders nothing when events array is empty', () => {
  const { container } = render(<AllDayStrip events={[]} />);
  expect(container.firstChild).toBeNull();
});

it('renders one pill per event', () => {
  render(<AllDayStrip events={[makeEvt('1', 'Rabies'), makeEvt('2', 'DHPP')]} />);
  expect(screen.getByText(/Rabies/)).toBeInTheDocument();
  expect(screen.getByText(/DHPP/)).toBeInTheDocument();
});
```

- [ ] **Step 3: Run tests**

```
npx vitest run src/components/routine/__tests__/AllDayStrip.test.tsx
```

Expected: Both tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/routine/AllDayStrip.tsx src/components/routine/__tests__/AllDayStrip.test.tsx
git commit -m "feat: add AllDayStrip component for medical events above timeline"
```

---

## Task 3: TimelineBlock component

**Files:**
- Create: `src/components/routine/TimelineBlock.tsx`
- Create: `src/components/routine/__tests__/TimelineBlock.test.tsx`

- [ ] **Step 1: Create `src/components/routine/TimelineBlock.tsx`**

```tsx
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BlockKind = 'base-pending' | 'base-completed' | 'standalone-log' | 'scheduled-log';

export interface StatusBadge {
  label: string;
  bg: string;
  fg: string;
}

interface Props {
  kind: BlockKind;
  icon: string;
  color: string;
  label: string;
  sublabel?: string;       // e.g. "07:23" (actual time for completed base slot)
  statusBadge?: StatusBadge;
  top: number;             // px from top of scrollable area
  height: number;          // px
  onDelete?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

export default function TimelineBlock({
  kind, icon, color, label, sublabel, statusBadge,
  top, height, onDelete, draggable, onDragStart,
}: Props) {
  const isPending = kind === 'base-pending' || kind === 'scheduled-log';

  return (
    <div
      className={cn(
        'absolute left-12 right-2 rounded-lg px-2 py-1 group select-none',
        isPending ? 'opacity-60' : 'opacity-100',
        draggable && 'cursor-grab active:cursor-grabbing',
      )}
      style={{
        top,
        height,
        backgroundColor: color + (isPending ? '10' : '1a'),
        border: `1.5px ${isPending ? 'dashed' : 'solid'} ${color}${isPending ? '40' : '70'}`,
      }}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <div className="flex items-start gap-1.5 h-full overflow-hidden">
        <span className="text-sm shrink-0 leading-none mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold leading-tight truncate">{label}</p>
          {sublabel && (
            <p className="text-[10px] text-muted-foreground leading-tight truncate">{sublabel}</p>
          )}
          {statusBadge && (
            <span
              className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-0.5"
              style={{ backgroundColor: statusBadge.bg, color: statusBadge.fg }}
            >
              {statusBadge.label}
            </span>
          )}
        </div>
        {onDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded text-muted-foreground hover:text-destructive transition-all mt-0.5"
            aria-label="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/routine/__tests__/TimelineBlock.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import TimelineBlock from '../TimelineBlock';

const base = { icon: '🐾', color: '#F59E0B', label: 'Walk', top: 100, height: 32 };

it('renders label', () => {
  render(<TimelineBlock {...base} kind="standalone-log" />);
  expect(screen.getByText('Walk')).toBeInTheDocument();
});

it('renders sublabel when provided', () => {
  render(<TimelineBlock {...base} kind="base-completed" sublabel="07:23" />);
  expect(screen.getByText('07:23')).toBeInTheDocument();
});

it('renders status badge when provided', () => {
  render(<TimelineBlock {...base} kind="scheduled-log" statusBadge={{ label: 'Scheduled', bg: '#fff', fg: '#000' }} />);
  expect(screen.getByText('Scheduled')).toBeInTheDocument();
});

it('calls onDelete when delete button is clicked', () => {
  const onDelete = vi.fn();
  render(<TimelineBlock {...base} kind="standalone-log" onDelete={onDelete} />);
  fireEvent.click(screen.getByLabelText('Delete'));
  expect(onDelete).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 3: Run tests**

```
npx vitest run src/components/routine/__tests__/TimelineBlock.test.tsx
```

Expected: All 4 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/routine/TimelineBlock.tsx src/components/routine/__tests__/TimelineBlock.test.tsx
git commit -m "feat: add TimelineBlock component"
```

---

## Task 4: QuickAddPopover component

**Files:**
- Create: `src/components/routine/QuickAddPopover.tsx`
- Create: `src/components/routine/__tests__/QuickAddPopover.test.tsx`

- [ ] **Step 1: Create `src/components/routine/QuickAddPopover.tsx`**

```tsx
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
    await logRoutine(selectedType, notes ? { notes } : {});
    if (addToBase) {
      const key = makeSlotKey(dayIdx, clickedTimeStr);
      await saveBase({ ...baseSlots, [key]: selectedType });
    }
    setSaving(false);
    onClose();
  };

  // Keep popover within viewport height
  const top = Math.min(anchorY, (typeof window !== 'undefined' ? window.innerHeight : 800) - 280);

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
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {QUICK_LOG_TYPES.map(({ type, icon, color }) => (
            <button
              key={type}
              onClick={() => setSelectedType(type as RoutineType)}
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
              title={type}
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
```

- [ ] **Step 2: Create `src/components/routine/__tests__/QuickAddPopover.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/hooks/useRoutine', () => ({ useRoutine: () => ({ logRoutine: vi.fn() }) }));
vi.mock('@/hooks/useBaseRoutine', () => ({
  useBaseRoutine: () => ({ save: vi.fn(), slots: {} }),
  makeSlotKey: (d: number, t: string) => `${d}_${t}`,
}));

import QuickAddPopover from '../QuickAddPopover';

const props = {
  anchorY: 200,
  clickedTimeStr: '07:30',
  dogId: 'dog1',
  dayIdx: 0,
  onClose: vi.fn(),
};

it('shows pre-filled time in heading', () => {
  render(<QuickAddPopover {...props} />);
  expect(screen.getByText('Log at 07:30')).toBeInTheDocument();
});

it('Save button is disabled until an activity type is selected', () => {
  render(<QuickAddPopover {...props} />);
  expect(screen.getByText('Save').closest('button')).toBeDisabled();
});

it('calls onClose when Cancel is clicked', () => {
  const onClose = vi.fn();
  render(<QuickAddPopover {...props} onClose={onClose} />);
  fireEvent.click(screen.getByText('Cancel'));
  expect(onClose).toHaveBeenCalled();
});
```

- [ ] **Step 3: Run tests**

```
npx vitest run src/components/routine/__tests__/QuickAddPopover.test.tsx
```

Expected: All 3 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/routine/QuickAddPopover.tsx src/components/routine/__tests__/QuickAddPopover.test.tsx
git commit -m "feat: add QuickAddPopover for double-click log entry with base routine toggle"
```

---

## Task 5: DayTimeline component

**Files:**
- Create: `src/components/routine/DayTimeline.tsx`
- Create: `src/components/routine/__tests__/DayTimeline.test.tsx`

- [ ] **Step 1: Create `src/components/routine/DayTimeline.tsx`**

```tsx
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Settings } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { useBaseRoutine, makeSlotKey } from '@/hooks/useBaseRoutine';
import { ROUTINE_TYPES, PEE_COLOR, POOP_COLOR } from '@/lib/constants';
import { fmtTime } from '@/lib/utils';
import {
  PX_PER_HOUR, minutesToPx, pxToTimeStr, timeStrToMinutes,
  matchSlotsToLogs, loadTimeRange, saveTimeRange,
} from '@/lib/timelineUtils';
import TimelineBlock from './TimelineBlock';
import AllDayStrip from './AllDayStrip';
import QuickAddPopover from './QuickAddPopover';
import type { RoutineLog, ScheduledLog } from '@/types';
import type { BaseRoutineSlots } from '@/hooks/useBaseRoutine';
import type { MedicalCalendarEvent } from '@/hooks/useMedical';
import type { StatusBadge } from './TimelineBlock';

export interface DayTimelineProps {
  selectedDate: Date;
  isToday: boolean;
  baseSlots: BaseRoutineSlots;
  logs: RoutineLog[];              // for selected day, ascending by timestamp
  scheduledLogs: ScheduledLog[];   // for selected day (non-declined)
  medicalEvents: MedicalCalendarEvent[];
  dogId: string;
  onLogDeleted: (id: string) => void;
  onScheduledLogDeleted: (id: string) => void;
}

function getRoutineMeta(type: string, customLabel?: string) {
  if (type === 'pee')  return { icon: '🌿', color: PEE_COLOR,  label: 'Pee' };
  if (type === 'poop') return { icon: '💩', color: POOP_COLOR, label: 'Poop' };
  const rt = ROUTINE_TYPES.find(r => r.type === type);
  return {
    icon:  rt?.icon  ?? '•',
    color: rt?.color ?? '#F59E0B',
    label: type === 'custom' && customLabel ? customLabel : (rt?.label ?? type),
  };
}

function weekdayIdx(date: Date): number {
  const d = date.getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
}

function dayStartMs(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function scheduledLogBadge(log: ScheduledLog): StatusBadge {
  const now = Date.now();
  if (log.status === 'pending_approval') return { label: 'Awaiting approval', bg: 'oklch(0.78 0.168 72 / 0.14)', fg: 'oklch(0.55 0.15 72)' };
  if (log.scheduledFor < now)            return { label: 'Overdue',           bg: 'oklch(0.577 0.245 27 / 0.12)', fg: 'oklch(0.577 0.245 27)' };
  return                                        { label: 'Scheduled',         bg: 'oklch(0.64 0.168 48 / 0.10)', fg: 'oklch(0.64 0.168 48)' };
}

const BLOCK_MIN_HEIGHT = 32; // px — visually equivalent to 30 min

export default function DayTimeline({
  selectedDate, isToday, baseSlots, logs, scheduledLogs,
  medicalEvents, dogId, onLogDeleted, onScheduledLogDeleted,
}: DayTimelineProps) {
  const [timeRange, setTimeRange]       = useState(loadTimeRange);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState(timeRange);
  const [showTopFade, setShowTopFade]   = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(true);
  const [quickAdd, setQuickAdd]         = useState<{ anchorY: number; timeStr: string } | null>(null);
  const [draggingId, setDraggingId]     = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { slots: currentBaseSlots, save: saveBase } = useBaseRoutine(dogId);

  const { startHour, endHour } = timeRange;
  const totalHours  = endHour - startHour;
  const totalHeight = totalHours * PX_PER_HOUR;
  const dayIdx      = weekdayIdx(selectedDate);
  const startMs     = dayStartMs(selectedDate);

  const { slotEvents, standaloneLogs } = useMemo(
    () => matchSlotsToLogs(baseSlots, logs, dayIdx, startMs),
    [baseSlots, logs, dayIdx, startMs],
  );

  // Scroll to current time on mount (today only)
  useEffect(() => {
    if (!isToday || !scrollRef.current) return;
    const n = new Date();
    const px = minutesToPx(n.getHours() * 60 + n.getMinutes(), startHour);
    scrollRef.current.scrollTop = Math.max(0, px - 100);
  }, [isToday, startHour]);

  // Current time line — updates every minute
  const [nowMin, setNowMin] = useState(() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); });
  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(() => { const n = new Date(); setNowMin(n.getHours() * 60 + n.getMinutes()); }, 60_000);
    return () => clearInterval(id);
  }, [isToday]);

  // Scroll fade detection
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowTopFade(el.scrollTop > 4);
    setShowBottomFade(el.scrollTop < el.scrollHeight - el.clientHeight - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    handleScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const applySettings = () => {
    const next = {
      startHour: Math.max(0, Math.min(settingsDraft.startHour, settingsDraft.endHour - 1)),
      endHour:   Math.min(24, Math.max(settingsDraft.endHour, settingsDraft.startHour + 1)),
    };
    setTimeRange(next);
    saveTimeRange(next);
    setShowSettings(false);
  };

  // Double-click on empty area → open QuickAddPopover
  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-block]')) return;
    const rect = scrollRef.current!.getBoundingClientRect();
    const yInScroll = e.clientY - rect.top + (scrollRef.current?.scrollTop ?? 0);
    setQuickAdd({ anchorY: e.clientY, timeStr: pxToTimeStr(yInScroll, startHour) });
  }, [startHour]);

  // Drag-and-drop
  const handleDragStart = useCallback((
    e: React.DragEvent,
    payload: { kind: 'log' | 'scheduled' | 'base'; id: string; slotKey?: string },
  ) => {
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(payload.id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggingId(null);
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    const payload = JSON.parse(raw) as { kind: 'log' | 'scheduled' | 'base'; id: string; slotKey?: string };

    const rect = e.currentTarget.getBoundingClientRect();
    const yInScroll = e.clientY - rect.top + (scrollRef.current?.scrollTop ?? 0);
    const newTimeStr = pxToTimeStr(yInScroll, startHour);
    const newMs = startMs + timeStrToMinutes(newTimeStr) * 60_000;

    if (payload.kind === 'log') {
      await updateDoc(doc(db, 'dogs', dogId, 'routines', payload.id), { timestamp: newMs });
    } else if (payload.kind === 'scheduled') {
      await updateDoc(doc(db, 'dogs', dogId, 'scheduledLogs', payload.id), { scheduledFor: newMs });
    } else if (payload.kind === 'base' && payload.slotKey) {
      const type = currentBaseSlots[payload.slotKey];
      if (!type) return;
      const updated = { ...currentBaseSlots };
      delete updated[payload.slotKey];
      updated[makeSlotKey(dayIdx, newTimeStr)] = type;
      await saveBase(updated); // updates recurring weekly schedule for this weekday
    }
  }, [startHour, startMs, dayIdx, dogId, currentBaseSlots, saveBase]);

  const hours = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i);

  return (
    <div className="flex flex-col flex-1 rounded-2xl border bg-card shadow-sm overflow-hidden min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
        <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
          {isToday ? 'Today' : format(selectedDate, 'EEEE, MMM d')}
        </span>
        <button
          onClick={() => { setSettingsDraft(timeRange); setShowSettings(p => !p); }}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Timeline settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Settings inline panel */}
      {showSettings && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 bg-muted/20 shrink-0">
          <span className="text-xs text-muted-foreground">From</span>
          <input type="number" min={0} max={23} value={settingsDraft.startHour}
            onChange={e => setSettingsDraft(p => ({ ...p, startHour: Number(e.target.value) }))}
            className="w-14 text-xs border border-border/50 rounded-lg px-2 py-1 bg-background outline-none focus:border-primary/50" />
          <span className="text-xs text-muted-foreground">to</span>
          <input type="number" min={1} max={24} value={settingsDraft.endHour}
            onChange={e => setSettingsDraft(p => ({ ...p, endHour: Number(e.target.value) }))}
            className="w-14 text-xs border border-border/50 rounded-lg px-2 py-1 bg-background outline-none focus:border-primary/50" />
          <button onClick={applySettings}
            className="ml-auto px-3 py-1 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: 'oklch(0.64 0.168 48)', color: 'oklch(0.99 0 0)' }}>
            Apply
          </button>
        </div>
      )}

      {/* Medical all-day strip */}
      <AllDayStrip events={medicalEvents} />

      {/* Scrollable timeline */}
      <div className="relative flex-1 overflow-hidden min-h-0">
        {showTopFade && (
          <div className="absolute top-0 left-0 right-0 h-8 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, var(--color-card), transparent)' }} />
        )}
        {showBottomFade && (
          <div className="absolute bottom-0 left-0 right-0 h-8 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to top, var(--color-card), transparent)' }} />
        )}

        <div
          ref={scrollRef}
          className="h-full overflow-y-auto"
          onDoubleClick={handleDoubleClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="relative" style={{ height: totalHeight }}>
            {/* Hour grid */}
            {hours.map(hour => {
              const top = (hour - startHour) * PX_PER_HOUR;
              return (
                <div key={hour}>
                  <span
                    className="absolute text-[10px] text-muted-foreground/50 tabular-nums select-none"
                    style={{ top: top - 7, left: 0, width: 44, textAlign: 'right', paddingRight: 6 }}
                  >
                    {String(hour).padStart(2, '0')}:00
                  </span>
                  <div className="absolute left-12 right-0 border-t border-border/30" style={{ top }} />
                  {hour < endHour && (
                    <div className="absolute left-12 right-0 border-t border-border/10"
                      style={{ top: top + PX_PER_HOUR / 2 }} />
                  )}
                </div>
              );
            })}

            {/* Current time indicator */}
            {isToday && nowMin >= startHour * 60 && nowMin <= endHour * 60 && (
              <div
                className="absolute left-10 right-0 flex items-center pointer-events-none z-20"
                style={{ top: minutesToPx(nowMin, startHour) }}
              >
                <div className="h-2 w-2 rounded-full bg-red-500 shrink-0 -ml-1" />
                <div className="flex-1 h-px bg-red-500" />
              </div>
            )}

            {/* Base routine slot blocks */}
            {slotEvents.map(slot => {
              const meta = getRoutineMeta(slot.type);
              const top  = minutesToPx(slot.minutesFromMidnight, startHour);
              const completed = !!slot.log;

              return (
                <div key={slot.slotKey} data-block="" style={{ opacity: draggingId === slot.slotKey ? 0.3 : 1 }}>
                  <TimelineBlock
                    kind={completed ? 'base-completed' : 'base-pending'}
                    icon={meta.icon}
                    color={meta.color}
                    label={meta.label}
                    sublabel={completed ? fmtTime(slot.log!.timestamp) : undefined}
                    top={top}
                    height={BLOCK_MIN_HEIGHT}
                    onDelete={completed ? () => onLogDeleted(slot.log!.id) : undefined}
                    draggable
                    onDragStart={e => handleDragStart(e, { kind: 'base', id: slot.slotKey, slotKey: slot.slotKey })}
                  />
                </div>
              );
            })}

            {/* Standalone log blocks */}
            {standaloneLogs.map(log => {
              const meta = getRoutineMeta(log.type, log.customLabel);
              const d    = new Date(log.timestamp);
              const top  = minutesToPx(d.getHours() * 60 + d.getMinutes(), startHour);

              return (
                <div key={log.id} data-block="" style={{ opacity: draggingId === log.id ? 0.3 : 1 }}>
                  <TimelineBlock
                    kind="standalone-log"
                    icon={meta.icon}
                    color={meta.color}
                    label={meta.label}
                    sublabel={fmtTime(log.timestamp)}
                    top={top}
                    height={BLOCK_MIN_HEIGHT}
                    onDelete={() => onLogDeleted(log.id)}
                    draggable
                    onDragStart={e => handleDragStart(e, { kind: 'log', id: log.id })}
                  />
                </div>
              );
            })}

            {/* Scheduled log blocks */}
            {scheduledLogs.map(log => {
              const rt  = ROUTINE_TYPES.find(r => r.type === log.type);
              const d   = new Date(log.scheduledFor);
              const top = minutesToPx(d.getHours() * 60 + d.getMinutes(), startHour);

              return (
                <div key={log.id} data-block="" style={{ opacity: draggingId === log.id ? 0.3 : 1 }}>
                  <TimelineBlock
                    kind="scheduled-log"
                    icon={rt?.icon ?? '📋'}
                    color={rt?.color ?? '#F59E0B'}
                    label={rt?.label ?? log.type}
                    sublabel={log.assignedToName}
                    statusBadge={scheduledLogBadge(log)}
                    top={top}
                    height={BLOCK_MIN_HEIGHT}
                    onDelete={() => onScheduledLogDeleted(log.id)}
                    draggable
                    onDragStart={e => handleDragStart(e, { kind: 'scheduled', id: log.id })}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick-add popover (double-click) */}
      {quickAdd && (
        <QuickAddPopover
          anchorY={quickAdd.anchorY}
          clickedTimeStr={quickAdd.timeStr}
          dogId={dogId}
          dayIdx={dayIdx}
          onClose={() => setQuickAdd(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/routine/__tests__/DayTimeline.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('firebase/firestore', () => ({ doc: vi.fn(), updateDoc: vi.fn() }));
vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('@/hooks/useBaseRoutine', () => ({
  useBaseRoutine: () => ({ slots: {}, save: vi.fn() }),
  makeSlotKey: (d: number, t: string) => `${d}_${t}`,
}));
vi.mock('@/hooks/useRoutine', () => ({ useRoutine: () => ({ logRoutine: vi.fn() }) }));

import DayTimeline from '../DayTimeline';
import type { DayTimelineProps } from '../DayTimeline';

// 2024-01-15 is a Monday
const monday = new Date(2024, 0, 15, 12, 0, 0);

const base: DayTimelineProps = {
  selectedDate: monday,
  isToday: false,
  baseSlots: {},
  logs: [],
  scheduledLogs: [],
  medicalEvents: [],
  dogId: 'dog1',
  onLogDeleted: vi.fn(),
  onScheduledLogDeleted: vi.fn(),
};

it('renders date heading for non-today', () => {
  render(<DayTimeline {...base} />);
  expect(screen.getByText('Monday, Jan 15')).toBeInTheDocument();
});

it('renders "Today" heading when isToday is true', () => {
  render(<DayTimeline {...base} isToday />);
  expect(screen.getByText('Today')).toBeInTheDocument();
});

it('renders hour labels from startHour to endHour', () => {
  render(<DayTimeline {...base} />);
  expect(screen.getByText('06:00')).toBeInTheDocument();
  expect(screen.getByText('22:00')).toBeInTheDocument();
});

it('renders a standalone log block', () => {
  const logs = [{ id: 'l1', type: 'walk', timestamp: new Date(2024, 0, 15, 8, 0).getTime() }] as any;
  render(<DayTimeline {...base} logs={logs} />);
  expect(screen.getByText('Walk')).toBeInTheDocument();
});

it('renders a pending base routine block', () => {
  render(<DayTimeline {...base} baseSlots={{ '0_07:00': 'eat' }} />);
  // 'eat' type label is 'Ate'
  expect(screen.getByText('Ate')).toBeInTheDocument();
});
```

- [ ] **Step 3: Run tests**

```
npx vitest run src/components/routine/__tests__/DayTimeline.test.tsx
```

Expected: All 5 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/routine/DayTimeline.tsx src/components/routine/__tests__/DayTimeline.test.tsx
git commit -m "feat: add DayTimeline with grid, matching, drag-and-drop, double-click add, and scroll fades"
```

---

## Task 6: Wire DayTimeline into RoutinePage

**Files:**
- Modify: `src/pages/routine/RoutinePage.tsx`

- [ ] **Step 1: Add import**

At the top of `RoutinePage.tsx`, after the existing component imports, add:

```tsx
import DayTimeline from '@/components/routine/DayTimeline';
```

- [ ] **Step 2: Fix log sort order (ascending for timeline)**

Find line ~328 in `RoutinePage.tsx`:
```tsx
return (logsByDay.get(key) ?? []).sort((a, b) => b.timestamp - a.timestamp);
```
Change to ascending:
```tsx
return (logsByDay.get(key) ?? []).sort((a, b) => a.timestamp - b.timestamp);
```

- [ ] **Step 3: Replace the day activity list card**

Remove the entire `{/* ── Day activity list ── */}` block (lines 527–592, the `<div className="rounded-2xl border bg-card shadow-sm flex-1 overflow-hidden">` and all its children).

Replace with:

```tsx
{/* ── Day timeline ── */}
<DayTimeline
  selectedDate={selectedDate}
  isToday={isSameDay(selectedDate, today)}
  baseSlots={baseSlots}
  logs={selectedDayLogs}
  scheduledLogs={[...selectedDayScheduled, ...selectedDayPending]}
  medicalEvents={selectedDayMedical}
  dogId={activeDog.id}
  onLogDeleted={deleteLog}
  onScheduledLogDeleted={deleteScheduledLog}
/>
```

- [ ] **Step 4: Run full test suite**

```
npx vitest run
```

Expected: All tests pass (no regressions).

- [ ] **Step 5: Verify in browser**

```
npm run dev
```

Check the following on `/routine`:

1. Timeline renders with hour grid (06:00–22:00)
2. "Today" shows a red current-time indicator; other days do not
3. Selecting today auto-scrolls to current time
4. Scroll fade gradients appear at top/bottom and disappear at the edges
5. Base routine slots appear at their configured times as dashed blocks
6. Log an activity (via quick log bar): it should appear as a solid block on the timeline; if within ±90 min of a same-type base slot, it fills that slot
7. Double-click an empty time area: QuickAddPopover opens with time pre-filled
8. In QuickAddPopover, enable "Add to base routine" and save: verify the slot appears in the Base Routine grid
9. Drag a log block to a new time: check Firestore (`dogs/{dogId}/routines/{logId}`) updates in the Firebase console
10. Drag a base routine slot: confirm the old slot key is gone and a new one at the new time appears (in Firebase console, `dogs/{dogId}/settings/baseRoutine`)
11. Settings gear: change time range to 08:00–20:00, verify grid and labels update; reload page, verify localStorage persists the setting

- [ ] **Step 6: Commit**

```bash
git add src/pages/routine/RoutinePage.tsx
git commit -m "feat: replace day activity list with DayTimeline on RoutinePage"
```
