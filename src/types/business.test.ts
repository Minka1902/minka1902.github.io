import { describe, test, expect } from 'vitest';
import {
  computeInvoiceTotals, ALL_CAPABILITIES, CAPABILITY_CATALOG, CAPABILITY_LABELS,
  DEFAULT_ROLE_TEMPLATES, BUSINESS_TYPES, ALL_MODULES, MODULE_CATALOG, isModuleEnabled,
} from '@/types';
import { distanceKm, formatDistance } from '@/lib/geo';

describe('computeInvoiceTotals', () => {
  test('sums line items with no tax', () => {
    const { subtotal, total } = computeInvoiceTotals(
      [{ description: 'a', quantity: 2, unitPrice: 50 }, { description: 'b', quantity: 1, unitPrice: 25 }],
    );
    expect(subtotal).toBe(125);
    expect(total).toBe(125);
  });

  test('applies tax rate and rounds to cents', () => {
    const { subtotal, total } = computeInvoiceTotals(
      [{ description: 'groom', quantity: 1, unitPrice: 100 }], 17,
    );
    expect(subtotal).toBe(100);
    expect(total).toBe(117);
  });

  test('handles empty line items', () => {
    expect(computeInvoiceTotals([])).toEqual({ subtotal: 0, total: 0 });
  });
});

describe('capability catalog', () => {
  test('catalog and ALL_CAPABILITIES stay in sync', () => {
    expect(ALL_CAPABILITIES).toEqual(CAPABILITY_CATALOG.map(c => c.capability));
  });

  test('every capability has a label', () => {
    for (const cap of ALL_CAPABILITIES) {
      expect(CAPABILITY_LABELS[cap]).toBeTruthy();
    }
  });

  test('default role templates only reference real capabilities', () => {
    for (const tpl of DEFAULT_ROLE_TEMPLATES) {
      for (const cap of tpl.capabilities) {
        expect(ALL_CAPABILITIES).toContain(cap);
      }
    }
  });

  test('business types are non-empty', () => {
    expect(BUSINESS_TYPES.length).toBeGreaterThan(5);
  });
});

describe('module gating', () => {
  test('undefined modules means everything is enabled (back-compat)', () => {
    for (const m of ALL_MODULES) {
      expect(isModuleEnabled({ modules: undefined }, m)).toBe(true);
      expect(isModuleEnabled(null, m)).toBe(true);
    }
  });

  test('only listed modules are enabled when the set is explicit', () => {
    const biz = { modules: ['customers', 'appointments'] as typeof ALL_MODULES };
    expect(isModuleEnabled(biz, 'customers')).toBe(true);
    expect(isModuleEnabled(biz, 'appointments')).toBe(true);
    expect(isModuleEnabled(biz, 'inventory')).toBe(false);
    expect(isModuleEnabled(biz, 'shipments')).toBe(false);
  });

  test('catalog and ALL_MODULES stay in sync', () => {
    expect(ALL_MODULES).toEqual(MODULE_CATALOG.map(m => m.module));
  });
});

describe('geo distance', () => {
  test('distance between identical points is zero', () => {
    const p = { lat: 32.08, lng: 34.78 };
    expect(distanceKm(p, p)).toBeCloseTo(0, 5);
  });

  test('Tel Aviv → Jerusalem is roughly 55 km', () => {
    const telAviv = { lat: 32.0853, lng: 34.7818 };
    const jerusalem = { lat: 31.7683, lng: 35.2137 };
    const d = distanceKm(telAviv, jerusalem);
    expect(d).toBeGreaterThan(45);
    expect(d).toBeLessThan(65);
  });

  test('formatDistance switches to metres under 1 km', () => {
    expect(formatDistance(0.4)).toBe('400 m');
    expect(formatDistance(3.21)).toBe('3.2 km');
    expect(formatDistance(42)).toBe('42 km');
  });
});
