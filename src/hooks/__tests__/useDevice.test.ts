import { vi } from 'vitest';

vi.mock('@/lib/firebase', () => ({ db: {}, auth: {} }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { uid: 'u1', displayName: 'Alice' } }) }));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => () => {}),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(() => ({})),
}));

import { useDevices } from '@/hooks/useDevice';

test('useDevices is exported', () => {
  expect(typeof useDevices).toBe('function');
});
