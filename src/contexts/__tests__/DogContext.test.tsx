import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

const { mockOnSnapshot, mockQuery, mockWhere, mockCollection } = vi.hoisted(() => ({
  mockOnSnapshot: vi.fn(),
  mockQuery: vi.fn(),
  mockWhere: vi.fn(),
  mockCollection: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  onSnapshot: mockOnSnapshot,
  addDoc: vi.fn(),
  doc: vi.fn(() => ({})),
  updateDoc: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'u1', displayName: 'Alice', email: 'a@b.com' } }),
}));

import { DogProvider, useDog } from '@/contexts/DogContext';
import type { Dog } from '@/types';

const fakeDog: Dog = {
  id: 'd1', name: 'Buddy', isMix: false, sex: 'male', mainHumanId: 'u1',
  qrPublic: false,
  qrVisibility: { showAddress: false, showPhone: false, showRescueOrg: false, showMedicalAlerts: false },
  createdAt: 0, updatedAt: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCollection.mockReturnValue({});
  mockQuery.mockReturnValue({});
  mockWhere.mockReturnValue({});
  localStorage.clear();
});

test('provides dogs list from Firestore snapshot', async () => {
  mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
    cb({ docs: [{ id: 'd1', data: () => fakeDog }] });
    return () => {};
  });

  function Probe() {
    const { dogs } = useDog();
    return <div>{dogs.map(d => d.name).join(',')}</div>;
  }

  render(<DogProvider><Probe /></DogProvider>);
  expect(await screen.findByText('Buddy')).toBeInTheDocument();
});

test('isMainHuman returns true when user is mainHumanId', async () => {
  mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
    cb({ docs: [{ id: 'd1', data: () => fakeDog }] });
    return () => {};
  });

  function Probe() {
    const { isMainHuman } = useDog();
    return <div>{isMainHuman('d1') ? 'main' : 'not-main'}</div>;
  }

  render(<DogProvider><Probe /></DogProvider>);
  expect(await screen.findByText('main')).toBeInTheDocument();
});

test('restores active dog from localStorage', async () => {
  localStorage.setItem('packops_active_dog_id', 'd1');
  mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
    cb({ docs: [{ id: 'd1', data: () => fakeDog }] });
    return () => {};
  });

  function Probe() {
    const { activeDog } = useDog();
    return <div>{activeDog?.name ?? 'none'}</div>;
  }

  render(<DogProvider><Probe /></DogProvider>);
  expect(await screen.findByText('Buddy')).toBeInTheDocument();
});
