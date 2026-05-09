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
