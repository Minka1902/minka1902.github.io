import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/hooks/useRoutine', () => ({ useRoutine: () => ({ logRoutine: vi.fn() }) }));
vi.mock('@/hooks/useBaseRoutine', () => ({
  useBaseRoutine: () => ({ save: vi.fn(), slots: {} }),
  makeSlotKey: (d: number, t: string) => `${d}_${t}`,
}));

import QuickAddPopover from '../QuickAddPopover';

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
