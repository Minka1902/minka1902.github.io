import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useBusiness, useBusinessActions } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import BusinessProfileForm, { type BusinessProfileFormData } from '@/components/business/BusinessProfileForm';

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
