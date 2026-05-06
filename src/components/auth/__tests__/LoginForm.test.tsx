import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const { mockLogin } = vi.hoisted(() => ({ mockLogin: vi.fn() }));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ login: mockLogin, loading: false, user: null }),
}));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => vi.fn() };
});

import LoginForm from '@/components/auth/LoginForm';

beforeEach(() => { vi.clearAllMocks(); });

test('submits email and password to login', async () => {
  mockLogin.mockResolvedValue(undefined);
  render(<MemoryRouter><LoginForm /></MemoryRouter>);
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'secret');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  expect(mockLogin).toHaveBeenCalledWith('a@b.com', 'secret');
});

test('shows error message when login fails', async () => {
  mockLogin.mockRejectedValue({ code: 'auth/wrong-password' });
  render(<MemoryRouter><LoginForm /></MemoryRouter>);
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  expect(await screen.findByText(/incorrect password/i)).toBeInTheDocument();
});

test('disables submit button while submitting', async () => {
  mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
  render(<MemoryRouter><LoginForm /></MemoryRouter>);
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'pw');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
});
