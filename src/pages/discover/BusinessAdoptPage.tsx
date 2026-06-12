import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, HeartHandshake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApplyForAdoption, useDirectoryEntry, usePublicAdoptables } from '@/hooks/useDirectory';
import type { PublicAdoptable } from '@/types';

export default function BusinessAdoptPage() {
  const { bid } = useParams<{ bid: string }>();
  const { entry, loading } = useDirectoryEntry(bid);
  const { adoptables, loading: adoptablesLoading } = usePublicAdoptables(bid);
  const { apply } = useApplyForAdoption();

  const [applyingTo, setApplyingTo] = useState<PublicAdoptable | null>(null);
  const [housing, setHousing] = useState('');
  const [hasYard, setHasYard] = useState(false);
  const [otherPets, setOtherPets] = useState('');
  const [experience, setExperience] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  if (loading) {
    return <div className="mx-auto max-w-xl space-y-4 p-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-48 w-full rounded-xl" /></div>;
  }
  if (!entry) {
    return (
      <div className="mx-auto max-w-xl py-14 text-center text-sm text-muted-foreground">
        Business not found. <Link to="/discover" className="underline">Back to discover</Link>
      </div>
    );
  }

  const submitApplication = async () => {
    if (!bid || !applyingTo || !housing.trim()) return;
    setSubmitting(true);
    try {
      await apply(bid, entry, {
        listingId: applyingTo.id,
        petName: applyingTo.name,
        applicantPhone: phone.trim() || undefined,
        homeInfo: {
          housing: housing.trim(),
          hasYard,
          otherPets: otherPets.trim() || undefined,
          experience: experience.trim() || undefined,
        },
      });
      setAppliedIds(prev => [...prev, applyingTo.id]);
      setApplyingTo(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-5 p-1 sm:p-2">
      <Button render={<Link to={`/discover/${bid}`} />} variant="ghost" size="sm" className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> {entry.name}
      </Button>

      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Adopt from {entry.name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Apply online — the shelter reviews every application.</p>
      </div>

      {adoptablesLoading ? (
        <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : adoptables.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <HeartHandshake className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No animals listed for adoption right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {adoptables.map(animal => (
            <Card key={animal.id}>
              <CardContent className="flex items-start justify-between gap-3 p-3">
                <div className="flex min-w-0 gap-3">
                  {animal.photoURLs?.[0] && (
                    <img src={animal.photoURLs[0]} alt={animal.name} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {animal.name}
                      {animal.status === 'pending' && <Badge variant="outline">Adoption pending</Badge>}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {animal.species}{animal.breed ? ` · ${animal.breed}` : ''}
                      {animal.ageMonths != null ? ` · ${animal.ageMonths} mo` : ''}
                      {animal.sex ? ` · ${animal.sex}` : ''}
                      {animal.fee != null ? ` · fee ${animal.fee.toFixed(2)} ${entry.currency ?? ''}` : ''}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{animal.description}</p>
                  </div>
                </div>
                {appliedIds.includes(animal.id) ? (
                  <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> Applied
                  </span>
                ) : animal.status === 'available' ? (
                  <Button size="sm" className="shrink-0" onClick={() => setApplyingTo(animal)}>Apply</Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!applyingTo} onOpenChange={o => { if (!o) setApplyingTo(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Apply to adopt {applyingTo?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="apply-housing">Housing <span className="text-destructive">*</span></Label>
              <Input id="apply-housing" value={housing} onChange={e => setHousing(e.target.value)} placeholder="e.g. apartment, house" required />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={hasYard} onCheckedChange={setHasYard} />
              I have a yard
            </label>
            <div className="space-y-1.5">
              <Label htmlFor="apply-pets">Other pets</Label>
              <Input id="apply-pets" value={otherPets} onChange={e => setOtherPets(e.target.value)} placeholder="e.g. one senior cat" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apply-exp">Experience with animals</Label>
              <Textarea id="apply-exp" value={experience} onChange={e => setExperience(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apply-phone">Phone</Label>
              <Input id="apply-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Optional" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApplyingTo(null)}>Cancel</Button>
              <Button onClick={submitApplication} disabled={submitting || !housing.trim()}>
                {submitting ? 'Submitting…' : 'Submit application'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
