import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import OrgProfileForm, { type OrgFormFields } from '@/components/org/OrgProfileForm';
import { useCreateOrg } from '@/hooks/useOrg';

export default function CreateOrgPage() {
  const navigate = useNavigate();
  const { createOrg } = useCreateOrg();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (fields: OrgFormFields) => {
    setLoading(true);
    try {
      const id = await createOrg({
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
      navigate(`/orgs/${id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <OrgProfileForm loading={loading} submitLabel="Create Organization" onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
