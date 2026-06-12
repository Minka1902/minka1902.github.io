import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAppointments, useBusiness, useInvoices, useOrders, useStays } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import { appointmentVolumeByDay, orderFunnel, revenueByDay, topProducts, topServices } from '@/lib/reports';
import { occupancyByDate, todayStr } from '@/lib/occupancy';
import { isModuleEnabled } from '@/types';

const WINDOW_DAYS = 30;

const shortDate = (d: string) => d.slice(5); // 'MM-DD'

export default function ReportsPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const currency = activeBusiness?.currency ?? 'USD';

  const canSee = can('view_reports');
  const hasInvoices = isModuleEnabled(activeBusiness, 'invoices') && (can('view_invoices') || can('manage_invoices'));
  const hasOrders = isModuleEnabled(activeBusiness, 'orders') && (can('view_orders') || can('manage_orders'));
  const hasAppointments = isModuleEnabled(activeBusiness, 'appointments') && (can('view_appointments') || can('manage_appointments'));
  const hasBoarding = isModuleEnabled(activeBusiness, 'boarding') && (can('view_boarding') || can('manage_boarding'));

  const { invoices } = useInvoices(canSee && hasInvoices ? bid : '');
  const { orders } = useOrders(canSee && hasOrders ? bid : '');
  const { appointments } = useAppointments(canSee && hasAppointments ? bid : '');
  const { stays } = useStays(canSee && hasBoarding ? bid : '');

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canSee) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to reports.</div>;
  }

  const revenue = revenueByDay(invoices, WINDOW_DAYS);
  const revenueTotal = revenue.reduce((s, p) => s + p.value, 0);
  const volume = appointmentVolumeByDay(appointments, WINDOW_DAYS);
  const products = topProducts(orders);
  const services = topServices(appointments);
  const funnel = orderFunnel(orders);

  // Boarding occupancy % over the next two weeks.
  const capacity = activeBusiness.boarding?.capacity ?? 0;
  const occupancy = capacity > 0
    ? Object.entries(occupancyByDate(stays, todayStr(), 14)).sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, value: Math.round((count / capacity) * 100) }))
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Reports</h1>

      {hasInvoices && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Revenue — last {WINDOW_DAYS} days
              <span className="ml-2 font-normal text-muted-foreground">{revenueTotal.toFixed(2)} {currency}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={shortDate} fontSize={11} minTickGap={24} />
                <YAxis fontSize={11} width={44} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(2)} ${currency}`, 'Payments']} />
                <Line type="monotone" dataKey="value" strokeWidth={2} dot={false} className="stroke-primary" stroke="currentColor" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {hasAppointments && (
        <Card>
          <CardHeader><CardTitle className="text-base">Appointments per day — last {WINDOW_DAYS} days</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volume}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={shortDate} fontSize={11} minTickGap={24} />
                <YAxis fontSize={11} width={28} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, 'Appointments']} />
                <Bar dataKey="value" className="fill-primary" fill="currentColor" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {hasOrders && (
          <Card>
            <CardHeader><CardTitle className="text-base">Top products</CardTitle></CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">No order data yet.</p>
              ) : (
                <ol className="space-y-1.5 text-sm">
                  {products.map((p, i) => (
                    <li key={p.name} className="flex justify-between gap-2">
                      <span className="truncate">{i + 1}. {p.name}</span>
                      <span className="shrink-0 text-muted-foreground">{p.quantity} sold · {p.revenue.toFixed(2)} {currency}</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        )}

        {hasAppointments && (
          <Card>
            <CardHeader><CardTitle className="text-base">Top services</CardTitle></CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground">No appointment data yet.</p>
              ) : (
                <ol className="space-y-1.5 text-sm">
                  {services.map((s, i) => (
                    <li key={s.name} className="flex justify-between gap-2">
                      <span className="truncate">{i + 1}. {s.name}</span>
                      <span className="shrink-0 text-muted-foreground">{s.count} booked</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {hasOrders && (
        <Card>
          <CardHeader><CardTitle className="text-base">Order funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {([
                ['New', funnel.placed],
                ['In progress', funnel.accepted + funnel.preparing + funnel.ready_for_pickup + funnel.out_for_delivery],
                ['Completed', funnel.completed],
                ['Cancelled / rejected', funnel.cancelled + funnel.rejected],
              ] as const).map(([label, count]) => (
                <div key={label} className="rounded-lg border px-3 py-2">
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hasBoarding && capacity > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Boarding occupancy — next 14 days</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancy}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={shortDate} fontSize={11} minTickGap={24} />
                <YAxis fontSize={11} width={36} unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Occupied']} />
                <Bar dataKey="value" className="fill-primary" fill="currentColor" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
