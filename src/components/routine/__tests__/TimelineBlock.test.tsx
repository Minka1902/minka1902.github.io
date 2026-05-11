import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import TimelineBlock from '../TimelineBlock';

const base = { icon: '🐾', color: '#F59E0B', label: 'Walk', top: 100, height: 32 };

it('renders label', () => {
  render(<TimelineBlock {...base} kind="standalone-log" />);
  expect(screen.getByText('Walk')).toBeInTheDocument();
});

it('renders sublabel when provided', () => {
  render(<TimelineBlock {...base} kind="base-completed" sublabel="07:23" />);
  expect(screen.getByText('07:23')).toBeInTheDocument();
});

it('renders status badge when provided', () => {
  render(<TimelineBlock {...base} kind="scheduled-log" statusBadge={{ label: 'Scheduled', bg: '#fff', fg: '#000' }} />);
  expect(screen.getByText('Scheduled')).toBeInTheDocument();
});

it('calls onDelete when delete button is clicked', () => {
  const onDelete = vi.fn();
  render(<TimelineBlock {...base} kind="standalone-log" onDelete={onDelete} />);
  fireEvent.click(screen.getByLabelText('Delete'));
  expect(onDelete).toHaveBeenCalledTimes(1);
});

it('does not render delete button when onDelete is not provided', () => {
  render(<TimelineBlock {...base} kind="standalone-log" />);
  expect(screen.queryByLabelText('Delete')).toBeNull();
});
