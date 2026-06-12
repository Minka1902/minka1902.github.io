import { describe, test, expect } from 'vitest';
import { addDays, fullDates, hasCapacityForRange, occupancyByDate, stayNights } from '@/lib/occupancy';
import type { StayStatus } from '@/types';

const stay = (startDate: string, endDate: string, status: StayStatus = 'approved') =>
  ({ startDate, endDate, status });

describe('addDays', () => {
  test('simple increment', () => {
    expect(addDays('2026-06-10', 1)).toBe('2026-06-11');
  });

  test('month rollover', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
  });

  test('year rollover and negative offsets', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  test('leap day', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('stayNights', () => {
  test('occupies [start, end) — checkout day is free', () => {
    expect(stayNights('2026-06-10', '2026-06-13')).toEqual(['2026-06-10', '2026-06-11', '2026-06-12']);
  });

  test('same-day daycare visit counts as one day', () => {
    expect(stayNights('2026-06-10', '2026-06-10')).toEqual(['2026-06-10']);
  });
});

describe('occupancyByDate', () => {
  test('counts only active stays', () => {
    const stays = [
      stay('2026-06-10', '2026-06-12', 'approved'),
      stay('2026-06-10', '2026-06-12', 'checked_in'),
      stay('2026-06-10', '2026-06-12', 'requested'),
      stay('2026-06-10', '2026-06-12', 'cancelled'),
      stay('2026-06-10', '2026-06-12', 'checked_out'),
    ];
    const counts = occupancyByDate(stays, '2026-06-10', 3);
    expect(counts).toEqual({ '2026-06-10': 2, '2026-06-11': 2, '2026-06-12': 0 });
  });
});

describe('hasCapacityForRange', () => {
  test('exactly-at-capacity blocks a new stay', () => {
    const stays = [stay('2026-06-10', '2026-06-12'), stay('2026-06-11', '2026-06-13')];
    expect(hasCapacityForRange(stays, 2, '2026-06-11', '2026-06-12')).toBe(false);
    expect(hasCapacityForRange(stays, 3, '2026-06-11', '2026-06-12')).toBe(true);
  });

  test('back-to-back stays do not double-book the turnover day', () => {
    const stays = [stay('2026-06-10', '2026-06-12')];
    expect(hasCapacityForRange(stays, 1, '2026-06-12', '2026-06-14')).toBe(true);
  });

  test('zero capacity never fits', () => {
    expect(hasCapacityForRange([], 0, '2026-06-10', '2026-06-11')).toBe(false);
  });
});

describe('fullDates', () => {
  test('reports only the dates at capacity within the window', () => {
    const stays = [stay('2026-06-10', '2026-06-12'), stay('2026-06-11', '2026-06-13')];
    expect(fullDates(stays, 2, '2026-06-09', 5)).toEqual(['2026-06-11']);
  });
});
