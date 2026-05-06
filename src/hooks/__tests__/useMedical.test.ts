import { vi } from 'vitest';

vi.mock('@/lib/firebase', () => ({ db: {}, auth: {} }));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'u1', displayName: 'Alice' } }),
}));
vi.mock('@/lib/firestore', () => ({ medicalCol: vi.fn(() => ({})) }));
vi.mock('firebase/firestore', () => ({
  onSnapshot: vi.fn(() => () => {}),
  addDoc: vi.fn(),
  doc: vi.fn(() => ({})),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  getFirestore: vi.fn(),
}));

import { useMedical, useUpcomingDue } from '@/hooks/useMedical';

test('useMedical is exported', () => { expect(typeof useMedical).toBe('function'); });
test('useUpcomingDue is exported', () => { expect(typeof useUpcomingDue).toBe('function'); });
