import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

const logRoutineMock = vi.fn().mockResolvedValue(undefined);
const saveBaseMock = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/useRoutine', () => ({ useRoutine: () => ({ logRoutine: logRoutineMock }) }));
vi.mock('@/hooks/useBaseRoutine', () => ({
  useBaseRoutine: () => ({ save: saveBaseMock, slots: {} }),
  makeSlotKey: (d: number, t: string) => `${d}_${t}`,
}));

import QuickAddPopover from '../QuickAddPopover';
import { QUICK_LOG_TYPES } from '@/lib/constants';

const props = {
  anchorY: 200,
  clickedTimeStr: '07:30',
  dogId: 'dog1',
  dayIdx: 0,
  onClose: vi.fn(),
};

it('shows pre-filled time in heading', () => {
  render(<QuickAddPopover {...props} />);
  expect(screen.getByText('Log at 07:30')).toBeInTheDocument();
});

it('Save button is disabled until an activity type is selected', () => {
  render(<QuickAddPopover {...props} />);
  expect(screen.getByText('Save').closest('button')).toBeDisabled();
});

it('calls onClose when Cancel is clicked', () => {
  const onClose = vi.fn();
  render(<QuickAddPopover {...props} onClose={onClose} />);
  fireEvent.click(screen.getByText('Cancel'));
  expect(onClose).toHaveBeenCalled();
});

it('shows Add to base routine checkbox', () => {
  render(<QuickAddPopover {...props} />);
  expect(screen.getByText('Add to base routine')).toBeInTheDocument();
});

it('Save button enables after selecting a type', async () => {
  render(<QuickAddPopover {...props} />);
  fireEvent.click(screen.getByRole('button', { name: QUICK_LOG_TYPES[0].label }));
  expect(screen.getByText('Save').closest('button')).not.toBeDisabled();
});

it('calls logRoutine when Save is clicked after selecting a type', async () => {
  logRoutineMock.mockClear();
  render(<QuickAddPopover {...props} />);
  fireEvent.click(screen.getByRole('button', { name: QUICK_LOG_TYPES[0].label }));
  fireEvent.click(screen.getByText('Save'));
  await waitFor(() => expect(logRoutineMock).toHaveBeenCalledTimes(1));
});

it('closes when backdrop is clicked', () => {
  const onClose = vi.fn();
  const { container } = render(<QuickAddPopover {...props} onClose={onClose} />);
  // The first fixed child is the backdrop div
  const backdrop = container.querySelector('.fixed.inset-0.z-40');
  fireEvent.click(backdrop!);
  expect(onClose).toHaveBeenCalled();
});
