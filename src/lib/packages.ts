import type { CustomerPackage, CustomerPackageStatus, PackageCreditType, PackageDef } from '@/types';

// Package & membership credit logic. Status is derived, not trusted: a doc may
// say 'active' after its expiry passed, so every check re-derives.

/** The status a customer package should have right now. */
export function derivePackageStatus(
  pkg: Pick<CustomerPackage, 'creditsRemaining' | 'expiresAt'>,
  now: number = Date.now(),
): CustomerPackageStatus {
  if (pkg.expiresAt !== undefined && pkg.expiresAt < now) return 'expired';
  if (pkg.creditsRemaining <= 0) return 'exhausted';
  return 'active';
}

/** Whether a credit of the given type can be redeemed from this package. */
export function canRedeem(
  pkg: Pick<CustomerPackage, 'creditsRemaining' | 'expiresAt' | 'creditType'>,
  creditType: PackageCreditType,
  now: number = Date.now(),
): boolean {
  return pkg.creditType === creditType && derivePackageStatus(pkg, now) === 'active';
}

/** Expiry timestamp for a package sold now (undefined = never expires). */
export function packageExpiry(def: Pick<PackageDef, 'validityDays'>, soldAt: number = Date.now()): number | undefined {
  if (!def.validityDays) return undefined;
  return soldAt + def.validityDays * 24 * 60 * 60 * 1000;
}

/** Redeemable packages for a customer + credit type, soonest-expiring first. */
export function redeemablePackages(
  packages: CustomerPackage[],
  customerKey: { customerUserId?: string; customerId?: string },
  creditType: PackageCreditType,
  now: number = Date.now(),
): CustomerPackage[] {
  return packages
    .filter(p =>
      ((customerKey.customerUserId && p.customerUserId === customerKey.customerUserId) ||
       (customerKey.customerId && p.customerId === customerKey.customerId)) &&
      canRedeem(p, creditType, now))
    .sort((a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity));
}
