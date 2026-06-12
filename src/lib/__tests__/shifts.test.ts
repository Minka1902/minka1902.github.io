import { describe, test, expect } from 'vitest';
import { isOnShift, isOnTimeOff, localDateTime, shiftsOnDate } from '@/lib/shifts';
import type { Shift, TimeOffRequest } from '@/types';

const shift = (staffUserId: string, date: string, start: string, end: string): Shift => ({
  id: `${staffUserId}-${date}`, staffUserId, staffName: 'x', date, start, end,
  createdAt: 0, updatedAt: 0,
});

// Build a ms timestamp for a local date+time, matching localDateTime's reading.
const atLocal = (date: string, time: string) => {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm).getTime();
};

describe('localDateTime', () => {
  test('round-trips a local timestamp', () => {
    expect(localDateTime(atLocal('2026-06-10', '09:30'))).toEqual({ date: '2026-06-10', time: '09:30' });
  });
});

describe('isOnShift', () => {
  const shifts = [shift('u1', '2026-06-10', '09:00', '17:00'), shift('u2', '2026-06-10', '12:00', '20:00')];

  test('inside the shift window', () => {
    expect(isOnShift(shifts, 'u1', atLocal('2026-06-10', '10:00'))).toBe(true);
  });

  test('shift end is exclusive, start inclusive', () => {
    expect(isOnShift(shifts, 'u1', atLocal('2026-06-10', '09:00'))).toBe(true);
    expect(isOnShift(shifts, 'u1', atLocal('2026-06-10', '17:00'))).toBe(false);
  });

  test('wrong day or wrong person', () => {
    expect(isOnShift(shifts, 'u1', atLocal('2026-06-11', '10:00'))).toBe(false);
    expect(isOnShift(shifts, 'u3', atLocal('2026-06-10', '10:00'))).toBe(false);
  });
});

describe('shiftsOnDate', () => {
  test('filters and sorts by start time', () => {
    const shifts = [shift('u2', '2026-06-10', '12:00', '20:00'), shift('u1', '2026-06-10', '09:00', '17:00')];
    expect(shiftsOnDate(shifts, '2026-06-10').map(s => s.staffUserId)).toEqual(['u1', 'u2']);
  });
});

describe('isOnTimeOff', () => {
  const requests: TimeOffRequest[] = [
    { id: 'r1', staffUserId: 'u1', staffName: 'x', startDate: '2026-06-10', endDate: '2026-06-12', status: 'approved', createdAt: 0, updatedAt: 0 },
    { id: 'r2', staffUserId: 'u2', staffName: 'y', startDate: '2026-06-10', endDate: '2026-06-12', status: 'requested', createdAt: 0, updatedAt: 0 },
  ];

  test('approved request covers the date range inclusively', () => {
    expect(isOnTimeOff(requests, 'u1', '2026-06-10')).toBe(true);
    expect(isOnTimeOff(requests, 'u1', '2026-06-12')).toBe(true);
    expect(isOnTimeOff(requests, 'u1', '2026-06-13')).toBe(false);
  });

  test('pending requests do not count', () => {
    expect(isOnTimeOff(requests, 'u2', '2026-06-11')).toBe(false);
  });
});
