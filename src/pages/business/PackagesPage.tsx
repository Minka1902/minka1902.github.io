import { useState } from 'react';
import { Plus, Ticket, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBusiness, useCustomers, useCustomerPackages, usePackageDefs } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import { derivePackageStatus } from '@/lib/packages';
import type { PackageCreditType, PackageDef } from '@/types';

const CREDIT_TYPES: { value: PackageCreditType; label: string }[] = [
  { value: 'appointment', label: 'Appointments' },
  { value: 'stay', label: 'Stays / daycare days' },
  { value: 'class', label: 'Class sessions' },
];

interface DefFormProps {
  initial?: PackageDef;
  onSubmit: (data: Omit<PackageDef, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

function PackageDefForm({ initial, onSubmit, onCancel }: DefFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : '');
  const [credits, setCredits] = useState(initial?.credits != null ? String(initial.credits) : '10');
  const [creditType, setCreditType] = useState<PackageCreditType>(initial?.creditType ?? 'appointment');
  const [validityDays, setValidityDays] = useState(initial?.validityDays != null ? String(initial.validityDays) : '');
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || Number(credits) < 1) return;
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        price: Number(price) || 0,
        credits: Math.floor(Number(credits)),
        creditType,
        validityDays: validityDays !== '' ? Math.floor(Number(validityDays)) || undefined : undefined,
        active,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="pkg-name">Name <span className="text-destructive">*</span></Label>
        <Input id="pkg-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 10-walk pass" required />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="pkg-price">Price</Label>
          <Input id="pkg-price" type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pkg-credits">Credits</Label>
          <Input id="pkg-credits" type="number" min="1" step="1" value={credits} onChange={e => setCredits(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pkg-validity">Valid for (days)</Label>
          <Input id="pkg-validity" type="number" min="1" step="1" value={validityDays} onChange={e => setValidityDays(e.target.value)} placeholder="∞" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Credit type</Label>
        <Select value={creditType} onValueChange={v => setCreditType(v as PackageCreditType)}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CREDIT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={active} onCheckedChange={setActive} />
        Active (purchasable by customers)
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  );
}

export default function PackagesPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const currency = activeBusiness?.currency ?? 'USD';
  const { packageDefs, loading, createPackageDef, updatePackageDef, deletePackageDef } = usePackageDefs(bid);
  const { customerPackages, sellPackage, redeemCredit, deleteCustomerPackage } = useCustomerPackages(bid);
  const { customers } = useCustomers(bid);

  const [addOpen, setAddOpen] = useState(false);
  const [sellDef, setSellDef] = useState<PackageDef | null>(null);
  const [sellCustomerId, setSellCustomerId] = useState('');

  const canView = can('view_packages');
  const canManage = can('manage_packages');

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canView && !canManage) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to packages.</div>;
  }

  const sell = async () => {
    const customer = customers.find(c => c.id === sellCustomerId);
    if (!sellDef || !customer) return;
    await sellPackage(sellDef, {
      customerId: customer.id, customerName: customer.name, customerUserId: customer.linkedUserId,
    });
    setSellDef(null);
    setSellCustomerId('');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Packages</h1>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New package
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : packageDefs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Ticket className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No packages</p>
            <p className="mt-1 text-sm text-muted-foreground">Sell bundles like a 10-walk pass or a daycare membership.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {packageDefs.map(def => (
            <Card key={def.id}>
              <CardContent className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="truncate">{def.name}</span>
                    {!def.active && <Badge variant="outline">Hidden</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {def.credits} {CREDIT_TYPES.find(t => t.value === def.creditType)?.label.toLowerCase()} · {def.price.toFixed(2)} {currency}
                    {def.validityDays ? ` · valid ${def.validityDays} days` : ''}
                  </p>
                </div>
                {canManage && (
                  <div className="flex shrink-0 gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setSellDef(def)}>Sell</Button>
                    <Button size="sm" variant="outline" onClick={() => void updatePackageDef(def.id, { active: !def.active })}>
                      {def.active ? 'Hide' : 'Show'}
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm(`Delete ${def.name}?`)) void deletePackageDef(def.id); }} aria-label={`Delete ${def.name}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {customerPackages.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Sold packages</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {customerPackages.map(pkg => {
              const status = derivePackageStatus(pkg);
              return (
                <div key={pkg.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{pkg.customerName} — {pkg.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pkg.creditsRemaining}/{pkg.creditsTotal} credits left
                      {pkg.expiresAt ? ` · expires ${new Date(pkg.expiresAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={status === 'active' ? 'secondary' : 'outline'}>
                      {status === 'active' ? 'Active' : status === 'expired' ? 'Expired' : 'Used up'}
                    </Badge>
                    {canManage && status === 'active' && (
                      <Button size="sm" variant="outline" onClick={() => void redeemCredit(pkg)}>Redeem 1</Button>
                    )}
                    {canManage && (
                      <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm('Delete this customer package?')) void deleteCustomerPackage(pkg.id); }} aria-label="Delete customer package">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New package</DialogTitle></DialogHeader>
          <PackageDefForm
            onSubmit={async data => { await createPackageDef(data); setAddOpen(false); }}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!sellDef} onOpenChange={o => { if (!o) setSellDef(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sell "{sellDef?.name}"</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Select value={sellCustomerId} onValueChange={v => setSellCustomerId(v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Pick a customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Sells for {sellDef?.price.toFixed(2)} {currency} and raises a paid invoice.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSellDef(null)}>Cancel</Button>
              <Button onClick={sell} disabled={!sellCustomerId}>Sell package</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
