import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  signIn: vi.fn(),
  createUser: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  doc: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: mocks.onAuthStateChanged,
  signInWithEmailAndPassword: mocks.signIn,
  createUserWithEmailAndPassword: mocks.createUser,
  signOut: mocks.signOut,
  updateProfile: mocks.updateProfile,
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: mocks.doc,
  setDoc: mocks.setDoc,
  getDoc: mocks.getDoc,
  collection: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({ auth: {}, db: {} }));

import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function TestConsumer() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading</div>;
  return <div>{user ? `Hello ${user.displayName}` : 'Not logged in'}</div>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDoc.mockResolvedValue({ exists: () => false, data: () => null });
});

test('shows not-logged-in when no user', async () => {
  mocks.onAuthStateChanged.mockImplementation((_auth: unknown, cb: (u: null) => void) => {
    cb(null);
    return () => {};
  });
  render(<AuthProvider><TestConsumer /></AuthProvider>);
  expect(await screen.findByText('Not logged in')).toBeInTheDocument();
});

test('login calls signInWithEmailAndPassword', async () => {
  mocks.onAuthStateChanged.mockImplementation((_auth: unknown, cb: (u: null) => void) => {
    cb(null);
    return () => {};
  });
  mocks.signIn.mockResolvedValue({ user: { uid: '1', email: 'a@b.com', displayName: 'Alice' } });

  function LoginTrigger() {
    const { login } = useAuth();
    return <button onClick={() => login('a@b.com', 'pw')}>Login</button>;
  }
  render(<AuthProvider><LoginTrigger /></AuthProvider>);
  await userEvent.click(await screen.findByText('Login'));
  expect(mocks.signIn).toHaveBeenCalledWith(expect.anything(), 'a@b.com', 'pw');
});

test('register calls createUserWithEmailAndPassword and setDoc', async () => {
  mocks.onAuthStateChanged.mockImplementation((_auth: unknown, cb: (u: null) => void) => {
    cb(null);
    return () => {};
  });
  const fakeFbUser = { uid: 'u1', email: 'a@b.com', displayName: '' };
  mocks.createUser.mockResolvedValue({ user: fakeFbUser });
  mocks.updateProfile.mockResolvedValue(undefined);
  mocks.setDoc.mockResolvedValue(undefined);

  function RegisterTrigger() {
    const { register } = useAuth();
    return <button onClick={() => register('a@b.com', 'pw', 'Alice')}>Register</button>;
  }
  render(<AuthProvider><RegisterTrigger /></AuthProvider>);
  await userEvent.click(await screen.findByText('Register'));
  expect(mocks.createUser).toHaveBeenCalledWith(expect.anything(), 'a@b.com', 'pw');
  expect(mocks.setDoc).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ uid: 'u1', email: 'a@b.com', displayName: 'Alice' })
  );
});

test('logout calls signOut', async () => {
  mocks.onAuthStateChanged.mockImplementation((_auth: unknown, cb: (u: null) => void) => {
    cb(null);
    return () => {};
  });
  mocks.signOut.mockResolvedValue(undefined);

  function LogoutTrigger() {
    const { logout } = useAuth();
    return <button onClick={() => logout()}>Logout</button>;
  }
  render(<AuthProvider><LogoutTrigger /></AuthProvider>);
  await userEvent.click(await screen.findByText('Logout'));
  expect(mocks.signOut).toHaveBeenCalled();
});
