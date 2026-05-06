import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { displayName: 'Alice', email: 'a@b.com' }, logout: vi.fn() }),
}));

// Mock Outlet to render children marker
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, Outlet: () => <div>outlet-content</div> };
});

import AppShell from '@/components/layout/AppShell';

test('renders sidebar navigation links', () => {
  render(<MemoryRouter><AppShell /></MemoryRouter>);
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
  expect(screen.getByText('Routine')).toBeInTheDocument();
  expect(screen.getByText('Medical')).toBeInTheDocument();
});

test('renders outlet content area', () => {
  render(<MemoryRouter><AppShell /></MemoryRouter>);
  expect(screen.getByText('outlet-content')).toBeInTheDocument();
});
