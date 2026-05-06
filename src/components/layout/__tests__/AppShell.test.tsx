import { vi } from 'vitest';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: null, logout: vi.fn() }) }));
vi.mock('@/contexts/DogContext', () => ({ useDog: () => ({ activeDog: null, dogs: [], isMainHuman: () => false }) }));
vi.mock('@/hooks/useAlerts', () => ({ useAlerts: () => [] }));
vi.mock('@/lib/firebase', () => ({ auth: {}, db: {} }));

import AppShell from '@/components/layout/AppShell';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

test('AppShell, Sidebar and Topbar are exported', () => {
  expect(typeof AppShell).toBe('function');
  expect(typeof Sidebar).toBe('function');
  expect(typeof Topbar).toBe('function');
});
