import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Building2, CalendarDays, Package, Receipt, Truck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useBusiness, useAppointments, useInvoices, useProducts, useShipments,
} from '@/hooks/useBusiness';
import { dayStart, dayEnd, cn } from '@/lib/utils';
import { isLowStock } from '@/components/business/StockBadge';
import type { Capability } from '@/types';

interface KpiProps {
  cap: Capability;
  to: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}

export default function BusinessDashboardPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';

  const todayRange = useMemo(() => {
    const now = Date.now();
    return { from: dayStart(now), to: dayEnd(now) };
  }, []);
  const { appointments } = useAppointments(bid, bid ? todayRange : undefined);
  const { invoices } = useInvoices(bid);
  const { products } = useProducts(bid);
  const { shipments } = useShipments(bid);

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

  const unpaid = invoices.filter(i => i.status !== 'paid' && i.status !== 'void');
  const unpaidSum = unpaid.reduce((s, i) => s + (i.total - i.amountPaid), 0);
  const lowStock = products.filter(isLowStock);
  const pendingShipments = shipments.filter(s => s.status !== 'delivered' && s.status !== 'returned');

  const kpis: KpiProps[] = [];
  if (can('view_appointments')) {
    kpis.push({
      cap: 'view_appointments', to: '/business/appointments', icon: <CalendarDays className="h-5 w-5" />,
      label: "Today's appointments", value: String(appointments.length),
    });
  }
  if (can('view_invoices')) {
    kpis.push({
      cap: 'view_invoices', to: '/business/invoices', icon: <Receipt className="h-5 w-5" />,
      label: 'Unpaid invoices', value: String(unpaid.length), sub: money(unpaidSum),
    });
  }
  if (can('view_inventory')) {
    kpis.push({
      cap: 'view_inventory', to: '/business/inventory', icon: <Package className="h-5 w-5" />,
      label: 'Low-stock products', value: String(lowStock.length),
    });
  }
  if (can('view_shipments')) {
    kpis.push({
      cap: 'view_shipments', to: '/business/shipments', icon: <Truck className="h-5 w-5" />,
      label: 'Pending shipments', value: String(pendingShipments.length),
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{activeBusiness.name}</h1>
        <p className="text-sm text-muted-foreground">Dashboard</p>
      </div>

      {kpis.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-background py-14 text-center">
          <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">You don't have access to any dashboard metrics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {kpis.map(kpi => (
            <Link key={kpi.to} to={kpi.to} className="block">
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {kpi.icon}
                  </div>
                  <div>
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
    </div>
  );
}
