import { describe, test, expect } from 'vitest';
import {
  ALL_CAPABILITIES, ALL_MODULES, BUSINESS_TYPES, CAPABILITY_LABELS,
  classSpotsLeft, computeInvoiceTotals, computeOrderTotals, computePurchaseOrderTotal,
  DEFAULT_ROLE_TEMPLATES, findStockShortages, TYPE_MODULE_PRESETS,
} from '@/types';

describe('computeOrderTotals', () => {
  test('rounding matches computeInvoiceTotals for the same items', () => {
    const items = [
      { productId: 'p1', name: 'a', quantity: 3, unitPrice: 19.99 },
      { productId: 'p2', name: 'b', quantity: 1, unitPrice: 0.1 },
    ];
    const asInvoice = computeInvoiceTotals(
      items.map(i => ({ description: i.name, quantity: i.quantity, unitPrice: i.unitPrice })),
    );
    expect(computeOrderTotals(items).subtotal).toBe(asInvoice.subtotal);
  });

  test('delivery fee lands in total but not subtotal', () => {
    const { subtotal, total } = computeOrderTotals(
      [{ productId: 'p1', name: 'a', quantity: 2, unitPrice: 25 }], 7.5,
    );
    expect(subtotal).toBe(50);
    expect(total).toBe(57.5);
  });

  test('empty cart', () => {
    expect(computeOrderTotals([])).toEqual({ subtotal: 0, total: 0 });
  });
});

describe('findStockShortages', () => {
  const items = [
    { productId: 'p1', name: 'Kibble', quantity: 3, unitPrice: 10 },
    { productId: 'p2', name: 'Leash', quantity: 1, unitPrice: 20 },
  ];

  test('no shortages when stock covers every line', () => {
    expect(findStockShortages(items, { p1: 3, p2: 5 })).toEqual([]);
  });

  test('reports each short line with what is available', () => {
    expect(findStockShortages(items, { p1: 2 })).toEqual([
      { productId: 'p1', name: 'Kibble', requested: 3, available: 2 },
      { productId: 'p2', name: 'Leash', requested: 1, available: 0 },
    ]);
  });
});

describe('computePurchaseOrderTotal', () => {
  test('sums quantity × unit cost with cent rounding', () => {
    expect(computePurchaseOrderTotal([
      { productId: 'p1', name: 'a', quantity: 10, unitCost: 1.005 },
    ])).toBe(10.05);
  });
});

describe('classSpotsLeft', () => {
  test('counts only enrolled (not waitlisted/cancelled), never negative', () => {
    const enrollments = [
      { status: 'enrolled' as const }, { status: 'enrolled' as const },
      { status: 'waitlisted' as const }, { status: 'cancelled' as const },
    ];
    expect(classSpotsLeft({ capacity: 3 }, enrollments)).toBe(1);
    expect(classSpotsLeft({ capacity: 1 }, enrollments)).toBe(0);
  });
});

describe('TYPE_MODULE_PRESETS', () => {
  test('every business type has a preset of real modules', () => {
    for (const { type } of BUSINESS_TYPES) {
      const preset = TYPE_MODULE_PRESETS[type];
      expect(preset, type).toBeDefined();
      expect(preset.length).toBeGreaterThan(0);
      for (const m of preset) expect(ALL_MODULES).toContain(m);
    }
  });

  test('presets contain no duplicates', () => {
    for (const { type } of BUSINESS_TYPES) {
      const preset = TYPE_MODULE_PRESETS[type];
      expect(new Set(preset).size, type).toBe(preset.length);
    }
  });
});

describe('expanded capability catalog', () => {
  test('every new capability has a label', () => {
    for (const cap of ALL_CAPABILITIES) expect(CAPABILITY_LABELS[cap]).toBeTruthy();
  });

  test('role templates only reference real capabilities', () => {
    for (const tpl of DEFAULT_ROLE_TEMPLATES) {
      for (const cap of tpl.capabilities) expect(ALL_CAPABILITIES).toContain(cap);
    }
  });
});
