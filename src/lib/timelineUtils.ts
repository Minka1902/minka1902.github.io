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
