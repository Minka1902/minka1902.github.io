import { useState } from 'react';
import { MapPin, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import BusinessTypeSelector from './BusinessTypeSelector';
import { getCurrentPosition } from '@/lib/geo';
import type { Business, BusinessType, GeoPoint } from '@/types';

export interface BusinessProfileFormData {
  name: string;
  type: BusinessType;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  currency: string;
  requireMfa?: boolean;
  listed?: boolean;
  bookable?: boolean;
  services?: string[];
  location?: GeoPoint;
}

interface Props {
  initial: Business;
  onSubmit: (data: BusinessProfileFormData) => Promise<void>;
}

export default function BusinessProfileForm({ initial, onSubmit }: Props) {
  const [name, setName] = useState(initial.name);
  const [type, setType] = useState<BusinessType>(initial.type);
  const [email, setEmail] = useState(initial.email ?? '');
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [website, setWebsite] = useState(initial.website ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [currency, setCurrency] = useState(initial.currency);
  const [requireMfa, setRequireMfa] = useState(initial.requireMfa ?? false);
  const [listed, setListed] = useState(initial.listed ?? true);
  const [bookable, setBookable] = useState(initial.bookable ?? false);
  const [services, setServices] = useState((initial.services ?? []).join(', '));
  const [location, setLocation] = useState<GeoPoint | undefined>(initial.location);
  const [locLabel, setLocLabel] = useState(initial.location?.label ?? '');
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const useMyLocation = async () => {
    setLocating(true);
    setLocError(null);
    try {
      const pos = await getCurrentPosition();
      setLocation({ ...pos, label: locLabel.trim() || undefined });
    } catch {
      setLocError('Could not get your location. Check browser permissions.');
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      const serviceList = services.split(',').map(s => s.trim()).filter(Boolean);
      await onSubmit({
        name: name.trim(),
        type,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        description: description.trim() || undefined,
        currency: currency.trim() || 'USD',
        requireMfa,
        listed,
        bookable,
        services: serviceList.length ? serviceList : undefined,
        location: location ? { ...location, label: locLabel.trim() || undefined } : undefined,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="biz-name">Name <span className="text-destructive">*</span></Label>
        <Input id="biz-name" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="biz-type">Type</Label>
          <BusinessTypeSelector id="biz-type" value={type} onChange={setType} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="biz-currency">Currency</Label>
          <Input id="biz-currency" value={currency} onChange={e => setCurrency(e.target.value)} placeholder="USD" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="biz-email">Email</Label>
          <Input id="biz-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="biz-phone">Phone</Label>
          <Input id="biz-phone" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="biz-website">Website</Label>
        <Input id="biz-website" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="biz-desc">Description</Label>
        <Textarea id="biz-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
      </div>
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Require MFA</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Staff must use multi-factor authentication</p>
        </div>
        <Switch checked={requireMfa} onCheckedChange={setRequireMfa} />
      </div>

      {/* ── Public listing & location ── */}
      <div className="space-y-4 rounded-lg border border-dashed p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4 text-muted-foreground" /> Public listing
        </div>

        <div className="flex items-center justify-between">
          <div className="pr-4">
            <p className="text-sm font-medium">List in directory</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Let pet owners discover you in "Businesses near me"</p>
          </div>
          <Switch checked={listed} onCheckedChange={setListed} />
        </div>

        <div className="flex items-center justify-between">
          <div className="pr-4">
            <p className="text-sm font-medium">Accept online bookings</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Customers can request appointments from your listing</p>
          </div>
          <Switch checked={bookable} onCheckedChange={setBookable} disabled={!listed} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="biz-services">Services offered</Label>
          <Input
            id="biz-services"
            value={services}
            onChange={e => setServices(e.target.value)}
            placeholder="Grooming, Nail trim, Bath (comma separated)"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="biz-loc-label">Location</Label>
          <Input
            id="biz-loc-label"
            value={locLabel}
            onChange={e => setLocLabel(e.target.value)}
            placeholder="e.g. Austin, TX"
          />
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={useMyLocation} disabled={locating}>
              <LocateFixed className="h-3.5 w-3.5" />
              {locating ? 'Locating…' : 'Use my current location'}
            </Button>
            {location && (
              <span className="text-xs text-muted-foreground">
                Pinned: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </span>
            )}
          </div>
          {locError && <p className="text-xs text-destructive">{locError}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving || !name.trim()}>{saving ? 'Saving…' : 'Save changes'}</Button>
        {saved && <span className="text-sm text-green-600 dark:text-green-400">Saved</span>}
      </div>
    </form>
  );
}
