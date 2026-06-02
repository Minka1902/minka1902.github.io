import { useCallback } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import type { Capability } from '@/types';

/**
 * Client-side capability gate for the active business. UX-only — Firestore rules
 * are the authoritative boundary. The owner short-circuits to `true` for every
 * capability; other staff are checked against their denormalized capability set.
 */
export function usePermissions() {
  const { isOwner, myStaff } = useBusiness();

  const can = useCallback(
    (cap: Capability): boolean => {
      if (isOwner) return true;
      if (!myStaff || !myStaff.active) return false;
      return myStaff.capabilities.includes(cap);
    },
    [isOwner, myStaff],
  );

  const canAny = useCallback(
    (...caps: Capability[]): boolean => caps.some(c => can(c)),
    [can],
  );

  return { can, canAny, isOwner };
}
