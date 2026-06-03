import { describe, test, expect } from 'vitest';
import {
  computeInvoiceTotals, ALL_CAPABILITIES, CAPABILITY_CATALOG, CAPABILITY_LABELS,
  DEFAULT_ROLE_TEMPLATES, BUSINESS_TYPES,
} from '@/types';

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
