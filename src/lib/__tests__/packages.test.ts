import { describe, test, expect } from 'vitest';
import { canRedeem, derivePackageStatus, packageExpiry, redeemablePackages } from '@/lib/packages';
import type { CustomerPackage } from '@/types';

const NOW = Date.UTC(2026, 5, 12);
const DAY = 24 * 60 * 60 * 1000;

const pkg = (over: Partial<CustomerPackage>): CustomerPackage => ({
  id: 'p1', packageId: 'def1', name: '10-walk pass', creditType: 'appointment',
  customerName: 'Ada', creditsTotal: 10, creditsRemaining: 5, status: 'active',
  createdAt: 0, updatedAt: 0, ...over,
});

describe('derivePackageStatus', () => {
  test('active while credits remain and not expired', () => {
    expect(derivePackageStatus(pkg({}), NOW)).toBe('active');
  });

  test('exhausted at zero credits', () => {
    expect(derivePackageStatus(pkg({ creditsRemaining: 0 }), NOW)).toBe('exhausted');
  });

  test('expiry wins even when the stored status says active', () => {
    expect(derivePackageStatus(pkg({ expiresAt: NOW - 1 }), NOW)).toBe('expired');
  });

  test('no expiry means never expires', () => {
    expect(derivePackageStatus(pkg({ expiresAt: undefined }), NOW)).toBe('active');
  });
});

describe('canRedeem', () => {
  test('matching credit type on an active package', () => {
    expect(canRedeem(pkg({}), 'appointment', NOW)).toBe(true);
  });

  test('wrong credit type', () => {
    expect(canRedeem(pkg({}), 'stay', NOW)).toBe(false);
  });

  test('expired or exhausted package', () => {
    expect(canRedeem(pkg({ expiresAt: NOW - 1 }), 'appointment', NOW)).toBe(false);
    expect(canRedeem(pkg({ creditsRemaining: 0 }), 'appointment', NOW)).toBe(false);
  });
});

describe('packageExpiry', () => {
  test('validityDays from sale time', () => {
    expect(packageExpiry({ validityDays: 30 }, NOW)).toBe(NOW + 30 * DAY);
  });

  test('no validity means no expiry', () => {
    expect(packageExpiry({ validityDays: undefined }, NOW)).toBeUndefined();
  });
});

describe('redeemablePackages', () => {
  test('matches by app user or CRM customer, soonest expiry first', () => {
    const packages = [
      pkg({ id: 'a', customerUserId: 'u1', expiresAt: NOW + 10 * DAY }),
      pkg({ id: 'b', customerUserId: 'u1' }),
      pkg({ id: 'c', customerId: 'c1', expiresAt: NOW + 5 * DAY }),
      pkg({ id: 'd', customerUserId: 'u2' }),
      pkg({ id: 'e', customerUserId: 'u1', creditType: 'stay' }),
    ];
    const found = redeemablePackages(packages, { customerUserId: 'u1', customerId: 'c1' }, 'appointment', NOW);
    expect(found.map(p => p.id)).toEqual(['c', 'a', 'b']);
  });
});
