import { describe, test, expect } from 'vitest';
import type { Dog, RoutineLog } from '@/types';

describe('Types', () => {
  test('types compile', () => {
    const _dog: Dog = {
      id: '1', name: 'Rex', isMix: false, sex: 'male',
      mainHumanId: 'u1', qrPublic: false,
      qrVisibility: { showAddress: false, showPhone: false, showRescueOrg: false, showMedicalAlerts: false },
      createdAt: 0, updatedAt: 0,
    };

    const _log: RoutineLog = {
      id: '1', dogId: '1', type: 'walk', timestamp: 0,
      loggedBy: 'u1', loggedByName: 'Alice', source: 'manual',
    };

    expect(_dog.name).toBe('Rex');
    expect(_log.type).toBe('walk');
  });
});
