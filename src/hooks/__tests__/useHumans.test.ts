import { vi } from 'vitest';

vi.mock('@/lib/firebase', () => ({ db: {}, auth: {} }));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'u1', displayName: 'Alice', email: 'a@b.com' } }),
}));
vi.mock('@/lib/firestore', () => ({
  humansCol: vi.fn(() => ({})),
  pendingCol: vi.fn(() => ({})),
}));
vi.mock('firebase/firestore', () => ({
  onSnapshot: vi.fn(() => () => {}),
  addDoc: vi.fn(),
  doc: vi.fn(() => ({})),
  writeBatch: vi.fn(() => ({ set: vi.fn(), delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) })),
  deleteDoc: vi.fn(),
  getFirestore: vi.fn(),
}));

import { useHumans, usePendingHumans } from '@/hooks/useHumans';

test('useHumans is exported', () => {
  expect(typeof useHumans).toBe('function');
});

test('usePendingHumans is exported', () => {
  expect(typeof usePendingHumans).toBe('function');
});
