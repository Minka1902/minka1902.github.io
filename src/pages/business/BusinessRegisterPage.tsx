import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Building2, Camera, Loader2, MapPin } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useCreateBusiness } from '@/hooks/useBusiness';
import BusinessTypeSelector from '@/components/business/BusinessTypeSelector';
import AddressLocationPicker from '@/components/dog/AddressLocationPicker';
import type { BusinessType, HomeLocation } from '@/types';

export default function BusinessRegisterPage() {
  const { createBusiness } = useCreateBusiness();
  const { user } = useAuth();
  const navigate = useNavigate();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<BusinessType>('dog_walker');
  const [registrationId, setRegistrationId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [logoURL, setLogoURL] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [location, setLocation] = useState<HomeLocation>({ address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasExactLocation = location.lat !== undefined && location.lng !== undefined && !!location.address.trim();
  const valid = !!name.trim() && !!registrationId.trim() && !!logoURL && hasExactLocation;

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setLogoUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'png';
      const snap = await uploadBytes(storageRef(storage, `business-logos/${user.uid}_${Date.now()}.${ext}`), file);
      setLogoURL(await getDownloadURL(snap.ref));
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!valid) {
      setError('Logo, business ID and an exact address with a map location are all required.');
      return;
    }
    setSubmitting(true);
    try {
      await createBusiness({
        name: name.trim(),
        type,
        registrationId: registrationId.trim(),
        logoURL,
        currency: currency.trim() || 'USD',
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        description: description.trim() || undefined,
        address: { street: location.address.trim(), lat: location.lat, lng: location.lng },
        location: { lat: location.lat!, lng: location.lng!, label: location.address.trim() },
      });
      navigate('/business');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Register a business</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Business details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Logo (required) */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <Avatar className="h-16 w-16 rounded-xl">
                  {logoURL ? <AvatarImage src={logoURL} alt="Business logo" className="object-cover" /> : null}
                  <AvatarFallback className="rounded-xl text-lg">{name?.[0]?.toUpperCase() ?? <Building2 className="h-5 w-5" />}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
                  aria-label="Upload logo"
                >
                  {logoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
              </div>
              <div>
                <p className="text-sm font-medium">Logo <span className="text-destructive">*</span></p>
                <p className="text-xs text-muted-foreground">Shown in your public listing.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-name">Name <span className="text-destructive">*</span></Label>
              <Input id="reg-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Happy Tails Grooming" required />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="reg-type">Type</Label>
                <BusinessTypeSelector id="reg-type" value={type} onChange={setType} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-regid">Business ID <span className="text-destructive">*</span></Label>
                <Input id="reg-regid" value={registrationId} onChange={e => setRegistrationId(e.target.value)} placeholder="Registration / tax number" required />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-phone">Phone</Label>
                <Input id="reg-phone" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-currency">Currency</Label>
              <Input id="reg-currency" value={currency} onChange={e => setCurrency(e.target.value)} placeholder="USD" />
            </div>

            {/* Address + exact location (required) */}
            <div className="space-y-1.5 rounded-lg border border-dashed p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-muted-foreground" /> Address &amp; exact location <span className="text-destructive">*</span>
              </div>
              <AddressLocationPicker value={location} onChange={setLocation} />
              {!hasExactLocation && (
                <p className="text-xs text-muted-foreground">Search or drop a pin on the map so customers can find you.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-desc">Description</Label>
              <Textarea id="reg-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting || !valid}>
                {submitting ? 'Creating…' : 'Create business'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/business')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
