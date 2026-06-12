import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useBusiness, useBusinessActions } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import BusinessProfileForm, { type BusinessProfileFormData } from '@/components/business/BusinessProfileForm';
import AvailabilityEditor from '@/components/business/AvailabilityEditor';
import CommerceSettingsCard from '@/components/business/CommerceSettingsCard';
import { resyncCatalog } from '@/hooks/useBusiness';
import {
  ALL_MODULES, MODULE_CATALOG, isModuleEnabled,
  type BusinessModule, type CommerceSettings, type ModuleGroup, type WeeklyAvailability,
} from '@/types';

const MODULE_GROUPS: ModuleGroup[] = ['Operations', 'Customer', 'Specialty'];

export default function BusinessSettingsPage() {
  const { activeBusiness } = useBusiness();
  const { isOwner, can } = usePermissions();
  const navigate = useNavigate();
  const bid = activeBusiness?.id ?? '';
  const { updateBusiness, deleteBusiness } = useBusinessActions(bid);
  const [deleting, setDeleting] = useState(false);

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!can('manage_business') && !isOwner) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to business settings.</div>;
  }

  const toggleModule = async (module: BusinessModule, enabled: boolean) => {
    // Start from the current effective set (undefined ⇒ all enabled).
    const current = activeBusiness.modules ?? ALL_MODULES;
    const next = enabled
      ? ALL_MODULES.filter(m => current.includes(m) || m === module)
      : current.filter(m => m !== module);
    await updateBusiness({ modules: next });
  };

  const handleDelete = async () => {
    if (!confirm(`Permanently delete "${activeBusiness.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteBusiness();
      navigate('/business');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Settings</h1>

      <Card>
        <CardHeader><CardTitle>Business profile</CardTitle></CardHeader>
        <CardContent>
          <BusinessProfileForm
            initial={activeBusiness}
            onSubmit={async (data: BusinessProfileFormData) => { await updateBusiness(data); }}
          />
        </CardContent>
      </Card>

      {isModuleEnabled(activeBusiness, 'orders') && (
        <CommerceSettingsCard
          business={activeBusiness}
          onSave={async (commerce: CommerceSettings) => {
            await updateBusiness({ commerce });
            // Publish or retract the public product catalog to match the toggle.
            await resyncCatalog(bid, commerce.ordersOpen).catch(() => undefined);
          }}
        />
      )}

      {isModuleEnabled(activeBusiness, 'appointments') && (
        <Card>
          <CardHeader>
            <CardTitle>Booking hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Set your weekly opening hours and slot length. Customers booking online can only
              pick free slots within these hours.
            </p>
            <AvailabilityEditor
              initialAvailability={activeBusiness.availability}
              initialSlotMinutes={activeBusiness.slotMinutes}
              onSave={async (availability: WeeklyAvailability, slotMinutes: number) => {
                await updateBusiness({ availability, slotMinutes });
              }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pages &amp; modules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Turn off the features your business doesn't use. Disabled pages disappear from the
            sidebar — for example a trainer who only sells their time can hide Inventory and Shipments.
          </p>
          {MODULE_GROUPS.map(group => (
            <div key={group} className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{group}</p>
              <div className="divide-y rounded-lg border">
                {MODULE_CATALOG.filter(m => m.group === group).map(({ module, label, description }) => (
                  <div key={module} className="flex items-center justify-between px-4 py-3">
                    <div className="pr-4">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                    </div>
                    <Switch
                      checked={isModuleEnabled(activeBusiness, module)}
                      onCheckedChange={(v) => toggleModule(module, v)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {isOwner && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Danger zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Deleting this business removes all customers, appointments, invoices, inventory and staff records. This cannot be undone.
            </p>
            <Separator />
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete business'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
