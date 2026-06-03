import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateBusiness } from '@/hooks/useBusiness';
import BusinessTypeSelector from '@/components/business/BusinessTypeSelector';
import type { BusinessType } from '@/types';

export default function BusinessRegisterPage() {
  const { createBusiness } = useCreateBusiness();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [type, setType] = useState<BusinessType>('dog_walker');
  const [currency, setCurrency] = useState('USD');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createBusiness({
        name: name.trim(),
        type,
        currency: currency.trim() || 'USD',
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        description: description.trim() || undefined,
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
                <Label htmlFor="reg-currency">Currency</Label>
                <Input id="reg-currency" value={currency} onChange={e => setCurrency(e.target.value)} placeholder="USD" />
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
              <Label htmlFor="reg-desc">Description</Label>
              <Textarea id="reg-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting || !name.trim()}>
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
