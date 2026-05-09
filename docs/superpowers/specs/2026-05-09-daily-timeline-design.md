# Daily Timeline View — Design Spec
**Date:** 2026-05-09

## Overview

Replace the day activity list on `RoutinePage` with a Google Calendar-style scrollable vertical timeline showing all events for the selected day: base routine slots, routine logs, scheduled logs, and medical events.

---

## Layout Changes

`RoutinePage` keeps unchanged:
- Page header (title, "Base Routine" + "Schedule" buttons)
- Pending approvals banner
- Week calendar strip (date navigation)
- Quick log strip

The "Day activity list" card (`rounded-2xl border bg-card`) is replaced with `DayTimeline`. It takes `flex-1` height and scrolls internally.

---

## DayTimeline Component

**File:** `src/components/routine/DayTimeline.tsx`

### Rendering
- **64px per hour** vertical density
- **Left gutter (48px):** hour labels at the top of each hour slot (e.g. `06:00`)
- **Gridlines:** solid at every hour, faint (`border-border/15`) at every half-hour
- **Current time indicator:** red horizontal line with a small circle at the left edge, only on today's view; auto-scrolls into view on mount
- **Scroll fade gradients:** top and bottom fade overlays using a CSS `mask-image` linear gradient, hidden when scrolled to the respective edge (detected via scroll event)

### Time Range
- Default: `startHour: 6`, `endHour: 22`
- Persisted in `localStorage` under key `routineTimeRange`
- Settings icon in the timeline header opens an inline popover with two number inputs to adjust bounds

### Interactions
- **Double-click on empty time slot:** opens `QuickAddPopover` pre-filled with the clicked time
- **Drag event block:** repositions block on the timeline; on drop, saves the new time to Firestore

---

## Event Blocks

**File:** `src/components/routine/TimelineBlock.tsx`

All blocks are absolutely positioned within the scrollable area. Position formula:
```
top = (eventHour - startHour + eventMinute / 60) * 64px
height = max(30min worth = 32px, content height)
```

### Block Types

| Type | Visual | Data source |
|---|---|---|
| Base routine slot (pending) | Dashed border, muted, icon + label | `baseSlots["{dayIdx}_{HH:mm}"]` |
| Base routine slot (completed) | Solid fill, icon + label + actual logged time | Slot merged with matched `RoutineLog` |
| Standalone routine log | Solid fill, icon + label | `RoutineLog` with no matching slot |
| Scheduled log | Dashed border + status badge | `ScheduledLog` |

### Matching Logic (base slot ↔ routine log)
Computed via `useMemo` in `DayTimeline`:
1. For each base routine slot on the selected weekday, collect all `RoutineLog`s of the same type on the same day within ±90 minutes of the slot time.
2. Nearest log wins. Each log can only match one slot.
3. Matched logs are removed from the standalone pool; remaining logs render as independent blocks.

### Medical Events
Shown in a compact all-day strip (`AllDayStrip`) above the timeline, not on the time axis. Each item is a small pill with the medical category icon and title.

---

## Double-Click to Add Log

**File:** `src/components/routine/QuickAddPopover.tsx`

Opens an inline popover anchored to the clicked Y position. Contains:
- Activity type selector (same as existing `QUICK_LOG_TYPES`)
- Time field pre-filled with the clicked time (editable)
- Notes field
- "Also add to base routine" toggle — when enabled, after saving the log it also calls `useBaseRoutine.save()` to add a slot for that weekday + time
- Save / Cancel buttons

---

## Drag to Reschedule

Uses the HTML Drag and Drop API (no library dependency).

| Dragged item | On drop: saves |
|---|---|
| Routine log | Updates `timestamp` via `updateDoc` on the log document |
| Scheduled log | Updates `scheduledFor` via `updateDoc` |
| Base routine slot | Removes old slot key, adds new `{dayIdx}_{newTime}` key, saves via `useBaseRoutine.save()` — **this updates the recurring weekly schedule for that weekday, not just the selected day** |

Drag is constrained to the vertical axis within the timeline (no cross-day drag).

---

## New Files

| File | Purpose |
|---|---|
| `src/components/routine/DayTimeline.tsx` | Main scrollable timeline component |
| `src/components/routine/TimelineBlock.tsx` | Individual event block (all types) |
| `src/components/routine/AllDayStrip.tsx` | Medical events above the timeline |
| `src/components/routine/QuickAddPopover.tsx` | Double-click add log + "add to base routine" toggle |

## Modified Files

| File | Change |
|---|---|
| `src/pages/routine/RoutinePage.tsx` | Replace day activity list with `DayTimeline`; pass all needed data as props |

---

## Data Props to DayTimeline

```ts
interface DayTimelineProps {
  selectedDate: Date;
  isToday: boolean;                     // drives current-time indicator
  baseSlots: BaseRoutineSlots;          // from useBaseRoutine
  logs: RoutineLog[];                   // for selected day, sorted by timestamp
  scheduledLogs: ScheduledLog[];        // for selected day (non-declined)
  medicalEvents: MedicalCalendarEvent[]; // for selected day
  dogId: string;
  onLogDeleted: (id: string) => void;
  onScheduledLogDeleted: (id: string) => void;
}
```

---

## Out of Scope

- Cross-day drag (events stay on the selected day)
- Overlapping event layout (events at the same time stack side by side — deferred)
