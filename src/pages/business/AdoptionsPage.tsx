import { useState } from 'react';
import { Camera, HeartHandshake, Plus, Trash2 } from 'lucide-react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { storage } from '@/lib/firebase';
import { useAdoptionApplications, useAdoptionListings, useBusiness } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import type { AdoptionListing } from '@/types';

const STATUS_LABELS = {
  available: 'Available', pending: 'Pending', adopted: 'Adopted',
  submitted: 'New', under_review: 'In review', approved: 'Approved', declined: 'Declined',
} as const;

export default function AdoptionsPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const currency = activeBusiness?.currency ?? 'USD';
  const { listings, loading, createListing, updateListing, deleteListing } = useAdoptionListings(bid);
  const { applications, setApplicationStatus, approveApplication, deleteApplication } = useAdoptionApplications(bid);

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<'dog' | 'cat' | 'other'>('dog');
  const [breed, setBreed] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [description, setDescription] = useState('');
  const [fee, setFee] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const canView = can('view_adoptions');
  const canManage = can('manage_adoptions');

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canView && !canManage) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to adoptions.</div>;
  }

  const openApplications = applications.filter(a => a.status === 'submitted' || a.status === 'under_review');

  const submit = async () => {
    if (!name.trim() || !description.trim()) return;
    setSaving(true);
    try {
      const photoURLs: string[] = [];
      for (const file of photos.slice(0, 5)) {
        const ext = file.name.split('.').pop() ?? 'jpg';
        const snap = await uploadBytes(
          storageRef(storage, `adoptions/${bid}/${Date.now()}_${photoURLs.length}.${ext}`), file);
        photoURLs.push(await getDownloadURL(snap.ref));
      }
      await createListing({
        name: name.trim(),
        species,
        breed: breed.trim() || undefined,
        ageMonths: ageMonths !== '' ? Math.floor(Number(ageMonths)) || undefined : undefined,
        sex,
        description: description.trim(),
        photoURLs: photoURLs.length ? photoURLs : undefined,
        fee: fee !== '' ? Number(fee) : undefined,
        status: 'available',
      });
      setAddOpen(false);
      setName(''); setBreed(''); setAgeMonths(''); setDescription(''); setFee(''); setPhotos([]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Adoptions</h1>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New listing
          </Button>
        )}
      </div>

      {openApplications.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Applications ({openApplications.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {openApplications.map(app => (
              <div key={app.id} className="space-y-1.5 rounded-lg border px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {app.applicantName} → {app.petName}
                    <Badge variant="outline" className="ml-2">{STATUS_LABELS[app.status]}</Badge>
                  </p>
                  {canManage && (
                    <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm('Delete this application?')) void deleteApplication(app.id); }} aria-label="Delete application">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {app.homeInfo.housing}{app.homeInfo.hasYard ? ' · has yard' : ' · no yard'}
                  {app.homeInfo.otherPets ? ` · other pets: ${app.homeInfo.otherPets}` : ''}
                  {app.homeInfo.experience ? ` · ${app.homeInfo.experience}` : ''}
                  {app.applicantEmail ? ` · ${app.applicantEmail}` : ''}
                  {app.applicantPhone ? ` · ${app.applicantPhone}` : ''}
                </p>
                {canManage && (
                  <div className="flex gap-1.5">
                    {app.status === 'submitted' && (
                      <Button size="sm" variant="outline" onClick={() => void setApplicationStatus(app, 'under_review')}>Start review</Button>
                    )}
                    <Button size="sm" onClick={() => void approveApplication(app, listings.find(l => l.id === app.listingId))}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => void setApplicationStatus(app, 'declined')}>Decline</Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <HeartHandshake className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No listings</p>
            <p className="mt-1 text-sm text-muted-foreground">List an animal — it shows in the public directory.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map(listing => (
            <Card key={listing.id}>
              <CardContent className="flex items-start justify-between gap-3 p-3">
                <div className="flex min-w-0 gap-3">
                  {listing.photoURLs?.[0] && (
                    <img src={listing.photoURLs[0]} alt={listing.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {listing.name}
                      <Badge variant={listing.status === 'available' ? 'secondary' : 'outline'}>{STATUS_LABELS[listing.status]}</Badge>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {listing.species}{listing.breed ? ` · ${listing.breed}` : ''}
                      {listing.ageMonths != null ? ` · ${listing.ageMonths} mo` : ''}
                      {listing.sex ? ` · ${listing.sex}` : ''}
                      {listing.fee != null ? ` · fee ${listing.fee.toFixed(2)} ${currency}` : ''}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{listing.description}</p>
                  </div>
                </div>
                {canManage && (
                  <div className="flex shrink-0 flex-col gap-1">
                    {listing.status !== 'adopted' && (
                      <Button size="sm" variant="outline" onClick={() => void updateListing(listing.id, { status: 'adopted' })}>
                        Mark adopted
                      </Button>
                    )}
                    <Button variant="ghost" size="icon-sm" className="self-end" onClick={() => { if (confirm(`Delete ${listing.name}?`)) void deleteListing(listing.id); }} aria-label={`Delete ${listing.name}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New adoption listing</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="adopt-name">Name <span className="text-destructive">*</span></Label>
                <Input id="adopt-name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Species</Label>
                <Select value={species} onValueChange={v => setSpecies(v as 'dog' | 'cat' | 'other')}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">Dog</SelectItem>
                    <SelectItem value="cat">Cat</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="adopt-breed">Breed</Label>
                <Input id="adopt-breed" value={breed} onChange={e => setBreed(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adopt-age">Age (months)</Label>
                <Input id="adopt-age" type="number" min="0" value={ageMonths} onChange={e => setAgeMonths(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Sex</Label>
                <Select value={sex} onValueChange={v => setSex(v as 'male' | 'female')}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adopt-desc">Description <span className="text-destructive">*</span></Label>
              <Textarea id="adopt-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} required />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="adopt-fee">Adoption fee ({currency})</Label>
                <Input id="adopt-fee" type="number" min="0" step="0.01" value={fee} onChange={e => setFee(e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adopt-photos" className="flex items-center gap-1.5"><Camera className="h-4 w-4" /> Photos</Label>
                <Input id="adopt-photos" type="file" accept="image/*" multiple onChange={e => setPhotos(Array.from(e.target.files ?? []))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={saving || !name.trim() || !description.trim()}>
                {saving ? 'Saving…' : 'Create listing'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
