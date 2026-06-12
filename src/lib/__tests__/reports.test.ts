import { describe, test, expect } from 'vitest';
import { appointmentVolumeByDay, orderFunnel, revenueByDay, topProducts, topServices } from '@/lib/reports';
import type { Appointment, Invoice, Order } from '@/types';

// Fixtures pin "now" to a local date so day bucketing is deterministic.
const NOW = new Date(2026, 5, 12, 12, 0, 0); // 2026-06-12 local noon
const at = (daysAgo: number) => new Date(2026, 5, 12 - daysAgo, 10, 0, 0).getTime();

const invoice = (payments: { amount: number; paidAt: number }[]): Invoice => ({
  id: 'i', number: '1', customerId: 'c', customerName: 'Ada', lineItems: [],
  subtotal: 0, total: 0, amountPaid: 0, status: 'paid',
  payments: payments.map(p => ({ ...p, method: 'cash', recordedBy: 'u' })),
  createdAt: 0, updatedAt: 0, createdBy: 'u',
});

const order = (over: Partial<Order>): Order => ({
  id: 'o', items: [], customerName: 'Ada', fulfillment: 'pickup',
  paymentMethod: 'in_person', paymentStatus: 'unpaid', subtotal: 0, total: 0,
  status: 'placed', source: 'staff', createdAt: 0, updatedAt: 0, createdBy: 'u', ...over,
});

const appt = (over: Partial<Appointment>): Appointment => ({
  id: 'a', customerName: 'Ada', serviceLabel: 'Groom', startAt: at(0), endAt: at(0),
  status: 'completed', createdAt: 0, updatedAt: 0, createdBy: 'u', ...over,
});

describe('revenueByDay', () => {
  test('buckets payments into local days over the window', () => {
    const invoices = [
      invoice([{ amount: 100, paidAt: at(0) }, { amount: 50, paidAt: at(1) }]),
      invoice([{ amount: 25, paidAt: at(1) }, { amount: 999, paidAt: at(10) }]), // outside window
    ];
    const points = revenueByDay(invoices, 3, NOW);
    expect(points).toEqual([
      { date: '2026-06-10', value: 0 },
      { date: '2026-06-11', value: 75 },
      { date: '2026-06-12', value: 100 },
    ]);
  });
});

describe('topProducts', () => {
  test('ranks by revenue and skips cancelled/rejected orders', () => {
    const orders = [
      order({ items: [{ productId: 'p1', name: 'Kibble', quantity: 2, unitPrice: 30 }] }),
      order({ items: [{ productId: 'p2', name: 'Leash', quantity: 1, unitPrice: 100 }] }),
      order({ status: 'cancelled', items: [{ productId: 'p1', name: 'Kibble', quantity: 99, unitPrice: 30 }] }),
    ];
    expect(topProducts(orders)).toEqual([
      { name: 'Leash', quantity: 1, revenue: 100 },
      { name: 'Kibble', quantity: 2, revenue: 60 },
    ]);
  });
});

describe('topServices', () => {
  test('counts non-cancelled appointments per service', () => {
    const appointments = [
      appt({ serviceLabel: 'Groom' }), appt({ serviceLabel: 'Groom' }),
      appt({ serviceLabel: 'Nail trim' }),
      appt({ serviceLabel: 'Groom', status: 'cancelled' }),
      appt({ serviceLabel: 'Bath', status: 'no_show' }),
    ];
    expect(topServices(appointments)).toEqual([
      { name: 'Groom', count: 2 },
      { name: 'Nail trim', count: 1 },
    ]);
  });
});

describe('appointmentVolumeByDay', () => {
  test('buckets by local start day, excluding cancelled', () => {
    const appointments = [
      appt({ startAt: at(0) }), appt({ startAt: at(0) }),
      appt({ startAt: at(1) }),
      appt({ startAt: at(1), status: 'cancelled' }),
    ];
    expect(appointmentVolumeByDay(appointments, 2, NOW)).toEqual([
      { date: '2026-06-11', value: 1 },
      { date: '2026-06-12', value: 2 },
    ]);
  });
});

describe('orderFunnel', () => {
  test('counts every status bucket', () => {
    const funnel = orderFunnel([order({}), order({ status: 'completed' }), order({ status: 'completed' })]);
    expect(funnel.placed).toBe(1);
    expect(funnel.completed).toBe(2);
    expect(funnel.rejected).toBe(0);
  });
});
