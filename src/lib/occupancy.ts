import { ACTIVE_STAY_STATUSES, type Stay } from '@/types';

// Boarding occupancy math over 'YYYY-MM-DD' calendar dates. All date arithmetic
// is done on the string components — never through Date-with-timezone — so a
// stay means the same calendar nights to the business and to a customer abroad.

type StayRange = Pick<Stay, 'startDate' | 'endDate' | 'status'>;

/** date + n days, pure string math ('2026-01-31' + 1 ⇒ '2026-02-01'). */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

/** Today as a 'YYYY-MM-DD' string in the local calendar. */
export function todayStr(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Dates a stay occupies: [startDate, endDate) — the checkout day is free so
 * back-to-back stays don't collide. A same-day visit (daycare) occupies its
 * single day.
 */
export function stayNights(startDate: string, endDate: string): string[] {
  if (endDate <= startDate) return [startDate];
  const nights: string[] = [];
  for (let d = startDate; d < endDate; d = addDays(d, 1)) nights.push(d);
  return nights;
}

/** Occupied-space count per date over a window, counting only active stays. */
export function occupancyByDate(stays: StayRange[], from: string, days: number): Record<string, number> {
  const counts: Record<string, number> = {};
  for (let i = 0; i < days; i++) counts[addDays(from, i)] = 0;
  for (const stay of stays) {
    if (!ACTIVE_STAY_STATUSES.includes(stay.status)) continue;
    for (const night of stayNights(stay.startDate, stay.endDate)) {
      if (night in counts) counts[night]++;
    }
  }
  return counts;
}

/** Dates within the window already at (or over) capacity. */
export function fullDates(stays: StayRange[], capacity: number, from: string, days: number): string[] {
  const counts = occupancyByDate(stays, from, days);
  return Object.keys(counts).filter(d => counts[d] >= capacity).sort();
}

/** Whether one more stay over [startDate, endDate) fits under capacity. */
export function hasCapacityForRange(
  stays: StayRange[],
  capacity: number,
  startDate: string,
  endDate: string,
): boolean {
  if (capacity <= 0) return false;
  const nights = stayNights(startDate, endDate);
  const counts = occupancyByDate(stays, nights[0], nights.length);
  return nights.every(night => counts[night] < capacity);
}
