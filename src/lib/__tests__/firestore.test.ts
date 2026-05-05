import { vi } from 'vitest';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, ...pathSegments: string[]) => ({ path: pathSegments.join('/') })),
  getFirestore: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({ db: {} }));

import { routinesCol, medicalCol } from '@/lib/firestore';

test('routinesCol returns correct path', () => {
  const col = routinesCol('dog1') as unknown as { path: string };
  expect(col.path).toBe('dogs/dog1/routines');
});

test('medicalCol maps vaccination to correct subcollection', () => {
  const col = medicalCol('dog1', 'vaccination') as unknown as { path: string };
  expect(col.path).toBe('dogs/dog1/medicalVaccinations');
});

test('medicalCol maps medication correctly', () => {
  const col = medicalCol('dog1', 'medication') as unknown as { path: string };
  expect(col.path).toBe('dogs/dog1/medicalMedications');
});
