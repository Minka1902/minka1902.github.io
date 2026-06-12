import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, BedDouble, Building2, CalendarClock, CalendarDays, Dog, GraduationCap,
  HeartHandshake, MessageSquare, Package, PackagePlus, Receipt, ShoppingCart, Truck,
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useBusiness, useAdoptionApplications, useAppointments, useClasses, useInvoices, useOrders,
  useProducts, usePurchaseOrders, useShifts, useShipments, useStays, useThreads, useTimeOff,
  useWaitlist,
} from '@/hooks/useBusiness';
import { dayStart, dayEnd, cn } from '@/lib/utils';
import { isLowStock } from '@/components/business/StockBadge';
import { occupancyByDate, todayStr } from '@/lib/occupancy';
import { shiftsOnDate } from '@/lib/shifts';
import { revenueByDay } from '@/lib/reports';
import { isModuleEnabled, type BusinessModule, type Capability } from '@/types';

interface KpiProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}

// The Owner's Hub: one live preview card per enabled module the viewer may see,
// each linking into its page. Owners see everything; staff see their slice.
export default function BusinessDashboardPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';

  // A module's data is only subscribed when it's enabled AND the viewer holds
  // the cap — `use(bid or '')` keeps hook order stable while skipping reads.
  const sees = (module: BusinessModule, cap: Capability) =>
    isModuleEnabled(activeBusiness, module) && can(cap);

  const todayRange = useMemo(() => {
    const now = Date.now();
    return { from: dayStart(now), to: dayEnd(now) };
  }, []);
  const { appointments } = useAppointments(sees('appointments', 'view_appointments') ? bid : '', todayRange);
  const { invoices } = useInvoices(sees('invoices', 'view_invoices') ? bid : '');
  const { products } = useProducts(sees('inventory', 'view_inventory') ? bid : '');
  const { shipments } = useShipments(sees('shipments', 'view_shipments') ? bid : '');
  const { orders } = useOrders(sees('orders', 'view_orders') ? bid : '');
  const { stays } = useStays(sees('boarding', 'view_boarding') ? bid : '');
  const { threads } = useThreads(sees('messages', 'view_messages') ? bid : '');
  const { purchaseOrders } = usePurchaseOrders(sees('purchasing', 'view_purchasing') ? bid : '');
  const { shifts } = useShifts(sees('shifts', 'view_shifts') ? bid : '');
  const { requests: timeOffRequests } = useTimeOff(sees('shifts', 'manage_shifts') ? bid : '');
  const { applications } = useAdoptionApplications(sees('adoptions', 'view_adoptions') ? bid : '');
  const { classes } = useClasses(sees('classes', 'view_classes') ? bid : '');
  const { waitlist } = useWaitlist(sees('breeding', 'view_breeding') ? bid : '');

  if (!activeBusiness) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No business selected</p>
            <p className="mt-1 text-sm text-muted-foreground">Create a business to get started.</p>
          </div>
          <Link to="/business/new" className={cn(buttonVariants({ size: 'sm' }))}>Register a business</Link>
        </div>
      </div>
    );
  }

  const currency = activeBusiness.currency;
  const money = (n: number) => `${currency} ${n.toFixed(2)}`;
  const today = todayStr();

  const unpaid = invoices.filter(i => i.status !== 'paid' && i.status !== 'void');
  const unpaidSum = unpaid.reduce((s, i) => s + (i.total - i.amountPaid), 0);
  const lowStock = products.filter(isLowStock);
  const pendingShipments = shipments.filter(s => s.status !== 'delivered' && s.status !== 'returned');
  const newOrders = orders.filter(o => o.status === 'placed');
  const openOrders = orders.filter(o => !['completed', 'cancelled', 'rejected'].includes(o.status));
  const inHouse = occupancyByDate(stays, today, 1)[today] ?? 0;
  const stayRequests = stays.filter(s => s.status === 'requested');
  const unreadMessages = threads.reduce((s, t) => s + (t.unreadByStaff ?? 0), 0);
  const incomingPOs = purchaseOrders.filter(po => po.status === 'ordered');
  const onShiftToday = shiftsOnDate(shifts, today);
  const pendingTimeOff = timeOffRequests.filter(r => r.status === 'requested');
  const openApplications = applications.filter(a => a.status === 'submitted' || a.status === 'under_review');
  const openClasses = classes.filter(c => c.status === 'open');
  const waiting = waitlist.filter(w => w.status === 'waiting');
  const revenue = revenueByDay(invoices, 7);

  const kpis: KpiProps[] = [];
  if (sees('appointments', 'view_appointments')) {
    kpis.push({
      to: '/business/appointments', icon: <CalendarDays className="h-5 w-5" />,
      label: "Today's appointments", value: String(appointments.length),
    });
  }
  if (sees('orders', 'view_orders')) {
    kpis.push({
      to: '/business/orders', icon: <ShoppingCart className="h-5 w-5" />,
      label: 'New orders', value: String(newOrders.length),
      sub: `${openOrders.length} open in total`,
    });
  }
  if (sees('boarding', 'view_boarding')) {
    kpis.push({
      to: '/business/boarding', icon: <BedDouble className="h-5 w-5" />,
      label: 'Guests in house', value: `${inHouse}/${activeBusiness.boarding?.capacity ?? 0}`,
      sub: stayRequests.length ? `${stayRequests.length} request${stayRequests.length !== 1 ? 's' : ''} waiting` : undefined,
    });
  }
  if (sees('messages', 'view_messages')) {
    kpis.push({
      to: '/business/messages', icon: <MessageSquare className="h-5 w-5" />,
      label: 'Unread messages', value: String(unreadMessages),
    });
  }
  if (sees('invoices', 'view_invoices')) {
    kpis.push({
      to: '/business/invoices', icon: <Receipt className="h-5 w-5" />,
      label: 'Unpaid invoices', value: String(unpaid.length), sub: money(unpaidSum),
    });
  }
  if (sees('inventory', 'view_inventory')) {
    kpis.push({
      to: '/business/inventory', icon: <Package className="h-5 w-5" />,
      label: 'Low-stock products', value: String(lowStock.length),
    });
  }
  if (sees('purchasing', 'view_purchasing')) {
    kpis.push({
      to: '/business/purchasing', icon: <PackagePlus className="h-5 w-5" />,
      label: 'Incoming deliveries', value: String(incomingPOs.length),
    });
  }
  if (sees('shipments', 'view_shipments')) {
    kpis.push({
      to: '/business/shipments', icon: <Truck className="h-5 w-5" />,
      label: 'Pending shipments', value: String(pendingShipments.length),
    });
  }
  if (sees('shifts', 'view_shifts')) {
    kpis.push({
      to: '/business/shifts', icon: <CalendarClock className="h-5 w-5" />,
      label: 'On shift today', value: String(onShiftToday.length),
      sub: can('manage_shifts') && pendingTimeOff.length
        ? `${pendingTimeOff.length} time-off request${pendingTimeOff.length !== 1 ? 's' : ''}` : undefined,
    });
  }
  if (sees('adoptions', 'view_adoptions')) {
    kpis.push({
      to: '/business/adoptions', icon: <HeartHandshake className="h-5 w-5" />,
      label: 'Open applications', value: String(openApplications.length),
    });
  }
  if (sees('classes', 'view_classes')) {
    kpis.push({
      to: '/business/classes', icon: <GraduationCap className="h-5 w-5" />,
      label: 'Open classes', value: String(openClasses.length),
    });
  }
  if (sees('breeding', 'view_breeding')) {
    kpis.push({
      to: '/business/breeding', icon: <Dog className="h-5 w-5" />,
      label: 'Waitlist', value: String(waiting.length),
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{activeBusiness.name}</h1>
        <p className="text-sm text-muted-foreground">Hub</p>
      </div>

      {kpis.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-background py-14 text-center">
          <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">You don't have access to any dashboard metrics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map(kpi => (
            <Link key={kpi.to} to={kpi.to} className="block">
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {kpi.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold leading-tight">{kpi.value}</p>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    {kpi.sub && <p className="text-xs text-muted-foreground">{kpi.sub}</p>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {sees('invoices', 'view_invoices') && revenue.some(p => p.value > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Revenue — last 7 days
              <span className="ml-2 font-normal text-muted-foreground">
                {money(revenue.reduce((s, p) => s + p.value, 0))}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue}>
                <XAxis dataKey="date" tickFormatter={d => d.slice(5)} fontSize={11} />
                <Tooltip formatter={(v) => [money(Number(v)), 'Payments']} />
                <Bar dataKey="value" className="fill-primary" fill="currentColor" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
