import type { Shift, TimeOffRequest } from '@/types';
import { todayStr } from '@/lib/occupancy';

// Rota helpers. A "not on shift" result is a soft warning in assignment UIs,
// never a hard block — the rota is advisory.

/** Local 'YYYY-MM-DD' + 'HH:MM' for a ms timestamp. */
export function localDateTime(ms: number): { date: string; time: string } {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** Whether the staff member has a shift covering the given moment. */
export function isOnShift(shifts: Shift[], staffUserId: string, atMs: number): boolean {
  const { date, time } = localDateTime(atMs);
  return shifts.some(s =>
    s.staffUserId === staffUserId && s.date === date && s.start <= time && time < s.end,
  );
}

/** Staff with a shift on the given date, in start-time order. */
export function shiftsOnDate(shifts: Shift[], date: string): Shift[] {
  return shifts.filter(s => s.date === date).sort((a, b) => a.start.localeCompare(b.start));
}

/** Whether an approved time-off request covers the given date. */
export function isOnTimeOff(requests: TimeOffRequest[], staffUserId: string, date: string = todayStr()): boolean {
  return requests.some(r =>
    r.staffUserId === staffUserId && r.status === 'approved' &&
    r.startDate <= date && date <= r.endDate,
  );
}
