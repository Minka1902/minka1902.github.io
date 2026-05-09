import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Organization, OrgType } from '@/types';

const ORG_TYPES: { value: OrgType; label: string }[] = [
  { value: 'rescue',   label: 'Animal Rescue' },
  { value: 'shelter',  label: 'Shelter' },
  { value: 'breeder',  label: 'Breeder' },
  { value: 'training', label: 'Training Center' },
  { value: 'daycare',  label: 'Daycare / Boarding' },
  { value: 'other',    label: 'Other' },
];

export interface OrgFormFields {
  name: string;
  type: OrgType | '';
  description: string;
  email: string;
  phone: string;
  website: string;
  instagram: string;
  facebook: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Props {
  initial?: Partial<OrgFormFields>;
  loading?: boolean;
  submitLabel?: string;
  onSubmit: (data: OrgFormFields) => void | Promise<void>;
}

export default function OrgProfileForm({ initial, loading, submitLabel = 'Save', onSubmit }: Props) {
  const [fields, setFields] = useState<OrgFormFields>({
    name:        initial?.name        ?? '',
    type:        initial?.type        ?? '',
    description: initial?.description ?? '',
    email:       initial?.email       ?? '',
    phone:       initial?.phone       ?? '',
    website:     initial?.website     ?? '',
    instagram:   initial?.instagram   ?? '',
    facebook:    initial?.facebook    ?? '',
    street:      initial?.street      ?? '',
    city:        initial?.city        ?? '',
    state:       initial?.state       ?? '',
    zip:         initial?.zip         ?? '',
    country:     initial?.country     ?? '',
  });

  const set = (key: keyof OrgFormFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(fields);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Basic Info */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</h3>
        <div className="space-y-2">
          <Label htmlFor="org-name">Organization Name *</Label>
          <Input id="org-name" value={fields.name} onChange={set('name')} required placeholder="Paws & Rescue" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-type">Type</Label>
          <Select value={fields.type} onValueChange={v => setFields(f => ({ ...f, type: v as OrgType }))}>
            <SelectTrigger id="org-type">
              <SelectValue placeholder="Select type…" />
            </SelectTrigger>
            <SelectContent>
              {ORG_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-desc">Description</Label>
          <textarea
            id="org-desc"
            value={fields.description}
            onChange={set('description')}
            rows={3}
            placeholder="Tell people about your organization…"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </div>
      </section>

      {/* Contact */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="org-email">Email</Label>
            <Input id="org-email" type="email" value={fields.email} onChange={set('email')} placeholder="contact@org.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-phone">Phone</Label>
            <Input id="org-phone" type="tel" value={fields.phone} onChange={set('phone')} placeholder="+1 555 000 0000" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-website">Website</Label>
          <Input id="org-website" type="url" value={fields.website} onChange={set('website')} placeholder="https://yourorg.com" />
        </div>
      </section>

      {/* Address */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Address</h3>
        <div className="space-y-2">
          <Label htmlFor="org-street">Street</Label>
          <Input id="org-street" value={fields.street} onChange={set('street')} placeholder="123 Main St" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="org-city">City</Label>
            <Input id="org-city" value={fields.city} onChange={set('city')} placeholder="Springfield" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-state">State / Region</Label>
            <Input id="org-state" value={fields.state} onChange={set('state')} placeholder="IL" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="org-zip">ZIP / Postal Code</Label>
            <Input id="org-zip" value={fields.zip} onChange={set('zip')} placeholder="62701" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-country">Country</Label>
            <Input id="org-country" value={fields.country} onChange={set('country')} placeholder="US" />
          </div>
        </div>
      </section>

      {/* Social */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Social Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="org-instagram">Instagram</Label>
            <Input id="org-instagram" value={fields.instagram} onChange={set('instagram')} placeholder="@yourorg" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-facebook">Facebook</Label>
            <Input id="org-facebook" value={fields.facebook} onChange={set('facebook')} placeholder="facebook.com/yourorg" />
          </div>
        </div>
      </section>

      <Button type="submit" disabled={loading || !fields.name.trim()} className="w-full">
        {loading ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
