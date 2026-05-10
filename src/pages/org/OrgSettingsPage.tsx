import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useOrg } from '@/contexts/OrgContext';
import { useOrgActions, getOrgById } from '@/hooks/useOrg';
import OrgProfileForm, { type OrgFormFields } from '@/components/org/OrgProfileForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Organization } from '@/types';

export default function OrgSettingsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { orgs, isOrgAdmin, isOrgHead } = useOrg();

  const [org, setOrg] = useState<Organization | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const id = orgId ?? '';
  const { updateOrg, deleteOrg } = useOrgActions(id);
  const amAdmin = isOrgAdmin(id);
  const amHead = isOrgHead(id);

  useEffect(() => {
    if (!id) return;
    const found = orgs.find(o => o.id === id);
    if (found) { setOrg(found); setOrgLoading(false); }
    else getOrgById(id).then(o => { setOrg(o); setOrgLoading(false); });
  }, [id, orgs]);

  if (orgLoading) return <div className="text-muted-foreground p-8">Loading…</div>;
  if (!org || !amAdmin) return <div className="text-muted-foreground p-8">Not authorized.</div>;

  const handleSave = async (fields: OrgFormFields) => {
    setSaving(true);
    await updateOrg({
      name: fields.name,
      type: fields.type || undefined,
      description: fields.description || undefined,
      email: fields.email || undefined,
      phone: fields.phone || undefined,
      website: fields.website || undefined,
      instagram: fields.instagram || undefined,
      facebook: fields.facebook || undefined,
      address: (fields.street || fields.city || fields.state || fields.zip || fields.country)
        ? {
            street:  fields.street  || undefined,
            city:    fields.city    || undefined,
            state:   fields.state   || undefined,
            zip:     fields.zip     || undefined,
            country: fields.country || undefined,
          }
        : undefined,
    });
    setSaving(false);
  };

  const handleDeleteOrg = async () => {
    if (!window.confirm(`Delete "${org.name}"? This cannot be undone.`)) return;
    await deleteOrg();
    navigate('/orgs');
  };

  const initial: OrgFormFields = {
    name:        org.name             ?? '',
    type:        org.type             ?? '',
    description: org.description      ?? '',
    email:       org.email            ?? '',
    phone:       org.phone            ?? '',
    website:     org.website          ?? '',
    instagram:   org.instagram        ?? '',
    facebook:    org.facebook         ?? '',
    street:      org.address?.street  ?? '',
    city:        org.address?.city    ?? '',
    state:       org.address?.state   ?? '',
    zip:         org.address?.zip     ?? '',
    country:     org.address?.country ?? '',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings — {org.name}</h1>

      <Card>
        <CardHeader><CardTitle>Organization Profile</CardTitle></CardHeader>
        <CardContent>
          <OrgProfileForm initial={initial} loading={saving} submitLabel="Save Changes" onSubmit={handleSave} />
        </CardContent>
      </Card>

      {amHead && (
        <Card className="border-destructive/30">
          <CardHeader><CardTitle className="text-destructive">Danger Zone</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Delete Organization</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently removes the org, all members, enrolled dogs, tasks and reports.
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleDeleteOrg} className="gap-1.5 shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
