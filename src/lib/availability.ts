import type { WeeklyAvailability, BusySlot } from '@/types';

export interface Slot {
  start: number;
  end: number;
}

/**
 * Generate bookable appointment slots for a single calendar day, respecting the
 * business's weekly opening hours, the slot length, already-booked intervals, and
 * the current time (past slots are dropped).
 *
 * @param dayStartMs local midnight of the chosen day
 */
export function generateSlots(
  dayStartMs: number,
  availability: WeeklyAvailability | undefined,
  slotMinutes: number,
  busy: BusySlot[] = [],
  now: number = Date.now(),
): Slot[] {
  if (!availability || slotMinutes <= 0) return [];
  const weekday = new Date(dayStartMs).getDay();
  const hours = availability[weekday];
  if (!hours) return [];

  const [oh, om] = hours.open.split(':').map(Number);
  const [ch, cm] = hours.close.split(':').map(Number);
  const open = dayStartMs + (oh * 60 + om) * 60_000;
  const close = dayStartMs + (ch * 60 + cm) * 60_000;
  const step = slotMinutes * 60_000;

  const slots: Slot[] = [];
  for (let s = open; s + step <= close; s += step) {
    const e = s + step;
    if (s < now) continue;
    const overlaps = busy.some(b => s < b.end && e > b.start);
    if (overlaps) continue;
    slots.push({ start: s, end: e });
  }
  return slots;
}

/** Local midnight (ms) for the given day offset from today. */
export function dayStartOffset(offset: number): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.getTime();
}
