import { useState, useRef } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Loader2, Building2, Map } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { MapPickerDialog } from '@/components/dog/AddressLocationPicker';
import type { OrgType } from '@/types';

const ORG_TYPES: { value: OrgType; label: string }[] = [
  { value: 'rescue',    label: 'Animal Rescue' },
  { value: 'shelter',   label: 'Shelter' },
  { value: 'breeder',   label: 'Breeder' },
  { value: 'training',  label: 'Training Center' },
  { value: 'daycare',   label: 'Daycare / Boarding' },
  { value: 'veterinary',label: 'Veterinary' },
  { value: 'spa',       label: 'Grooming & Spa' },
  { value: 'boarding',  label: 'Boarding' },
  { value: 'other',     label: 'Other' },
];

export interface OrgFormFields {
  name: string;
  type: OrgType | '';
  description: string;
  logoUrl: string;
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
  lat?: number;
  lng?: number;
}

interface Props {
  initial?: Partial<OrgFormFields>;
  loading?: boolean;
  submitLabel?: string;
  onSubmit: (data: OrgFormFields) => void | Promise<void>;
}

export default function OrgProfileForm({ initial, loading, submitLabel = 'Save', onSubmit }: Props) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [mapOpen, setMapOpen] = useState(false);

  const [fields, setFields] = useState<OrgFormFields>({
    name:        initial?.name        ?? '',
    type:        initial?.type        ?? '',
    description: initial?.description ?? '',
    logoUrl:     initial?.logoUrl     ?? '',
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
    lat:         initial?.lat,
    lng:         initial?.lng,
  });

  const set = (key: keyof OrgFormFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields(f => ({ ...f, [key]: e.target.value }));

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `org-logos/${user.uid}_${Date.now()}.${ext}`;
      const snap = await uploadBytes(storageRef(storage, path), file);
      const url = await getDownloadURL(snap.ref);
      setFields(f => ({ ...f, logoUrl: url }));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(fields);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Logo */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Logo</h3>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-2xl border-2 border-border/60 bg-muted overflow-hidden flex items-center justify-center">
              {fields.logoUrl
                ? <img src={fields.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                : <Building2 className="h-8 w-8 text-muted-foreground/40" />
              }
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
              aria-label="Upload logo"
            >
              {uploading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Camera className="h-3.5 w-3.5" />
              }
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoFile}
            />
          </div>
          <div className="space-y-1.5 flex-1">
            <Label htmlFor="org-logo-url">Or paste a URL</Label>
            <Input
              id="org-logo-url"
              value={fields.logoUrl}
              onChange={set('logoUrl')}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>
      </section>

      {/* Basic Info */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</h3>
        <div className="space-y-2">
          <Label htmlFor="org-name">Organization Name <span className="text-destructive">*</span></Label>
          <Input id="org-name" value={fields.name} onChange={set('name')} required placeholder="Paws & Rescue" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-type">Type</Label>
          <Select value={fields.type} onValueChange={v => setFields(f => ({ ...f, type: v as OrgType }))}>
            <SelectTrigger id="org-type"><SelectValue placeholder="Select type…" /></SelectTrigger>
            <SelectContent>
              {ORG_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Address</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMapOpen(true)}
            className="gap-1.5 h-7 text-xs"
          >
            <Map className="h-3 w-3" />
            {fields.lat ? 'Edit on Map' : 'Pick on Map'}
          </Button>
        </div>
        {fields.lat && fields.lng && (
          <p className="text-[11px] text-muted-foreground/70 tabular-nums">
            📍 {fields.lat.toFixed(5)}, {fields.lng.toFixed(5)}
          </p>
        )}
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

      <Button type="submit" disabled={loading || uploading || !fields.name.trim()} className="w-full">
        {loading ? 'Saving…' : submitLabel}
      </Button>

      <MapPickerDialog
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        value={{ address: fields.street, lat: fields.lat, lng: fields.lng }}
        onConfirm={loc => setFields(f => ({
          ...f,
          street: loc.address,
          lat: loc.lat,
          lng: loc.lng,
        }))}
      />
    </form>
  );
}
