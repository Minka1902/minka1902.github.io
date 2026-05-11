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
