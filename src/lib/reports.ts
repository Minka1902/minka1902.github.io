import type { Appointment, Invoice, Order } from '@/types';
import { addDays, todayStr } from '@/lib/occupancy';

// Pure aggregations for the Reports page. Everything operates on collections the
// page already subscribes to — no extra queries or indexes.

export interface DayPoint { date: string; value: number }

/** Payments received per day over the trailing window (includes today). */
export function revenueByDay(invoices: Invoice[], days: number, now: Date = new Date()): DayPoint[] {
  const from = addDays(todayStr(now), -(days - 1));
  const byDate: Record<string, number> = {};
  for (let i = 0; i < days; i++) byDate[addDays(from, i)] = 0;
  for (const inv of invoices) {
    for (const p of inv.payments) {
      const d = new Date(p.paidAt);
      const pad = (n: number) => String(n).padStart(2, '0');
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      if (key in byDate) byDate[key] += p.amount;
    }
  }
  return Object.keys(byDate).sort().map(date => ({ date, value: Math.round(byDate[date] * 100) / 100 }));
}

export interface RankedItem { name: string; quantity: number; revenue: number }

/** Best-selling products across non-cancelled orders, by revenue. */
export function topProducts(orders: Order[], limit = 5): RankedItem[] {
  const byProduct: Record<string, RankedItem> = {};
  for (const order of orders) {
    if (order.status === 'cancelled' || order.status === 'rejected') continue;
    for (const item of order.items) {
      const entry = byProduct[item.productId] ??= { name: item.name, quantity: 0, revenue: 0 };
      entry.quantity += item.quantity;
      entry.revenue = Math.round((entry.revenue + item.quantity * item.unitPrice) * 100) / 100;
    }
  }
  return Object.values(byProduct).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

/** Most-booked services across non-cancelled appointments. */
export function topServices(appointments: Appointment[], limit = 5): { name: string; count: number }[] {
  const byService: Record<string, number> = {};
  for (const appt of appointments) {
    if (appt.status === 'cancelled' || appt.status === 'no_show') continue;
    byService[appt.serviceLabel] = (byService[appt.serviceLabel] ?? 0) + 1;
  }
  return Object.entries(byService)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Appointments starting on each day of the trailing window. */
export function appointmentVolumeByDay(appointments: Appointment[], days: number, now: Date = new Date()): DayPoint[] {
  const from = addDays(todayStr(now), -(days - 1));
  const byDate: Record<string, number> = {};
  for (let i = 0; i < days; i++) byDate[addDays(from, i)] = 0;
  const pad = (n: number) => String(n).padStart(2, '0');
  for (const appt of appointments) {
    if (appt.status === 'cancelled') continue;
    const d = new Date(appt.startAt);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (key in byDate) byDate[key]++;
  }
  return Object.keys(byDate).sort().map(date => ({ date, value: byDate[date] }));
}

/** How many orders sit in each status (the fulfilment funnel). */
export function orderFunnel(orders: Order[]): Record<Order['status'], number> {
  const funnel = {
    placed: 0, accepted: 0, preparing: 0, ready_for_pickup: 0,
    out_for_delivery: 0, completed: 0, cancelled: 0, rejected: 0,
  };
  for (const order of orders) funnel[order.status]++;
  return funnel;
}
