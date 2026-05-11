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
