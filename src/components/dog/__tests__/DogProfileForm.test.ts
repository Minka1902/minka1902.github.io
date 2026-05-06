import { vi } from 'vitest';

vi.mock('@/hooks/useDog', () => ({
  useDogActions: () => ({ createDog: vi.fn(), updateDog: vi.fn(), dogs: [] }),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/lib/firebase', () => ({ db: {}, auth: {} }));
vi.mock('firebase/firestore', () => ({ collection: vi.fn(), addDoc: vi.fn(), doc: vi.fn(), updateDoc: vi.fn() }));

import DogProfileForm from '@/components/dog/DogProfileForm';

test('DogProfileForm is exported', () => {
  expect(typeof DogProfileForm).toBe('function');
});
