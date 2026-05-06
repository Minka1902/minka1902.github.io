import { vi } from 'vitest';

vi.mock('@/lib/firebase', () => ({ db: {}, auth: {} }));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'u1', displayName: 'Alice' } }),
}));
vi.mock('@/lib/firestore', () => ({ routinesCol: vi.fn(() => ({})) }));
vi.mock('firebase/firestore', () => ({
  onSnapshot: vi.fn(() => () => {}),
  addDoc: vi.fn().mockResolvedValue({ id: 'r1' }),
  doc: vi.fn(() => ({})),
  deleteDoc: vi.fn(),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  getFirestore: vi.fn(),
}));

import { useRoutine } from '@/hooks/useRoutine';

test('useRoutine is exported', () => {
  expect(typeof useRoutine).toBe('function');
});
