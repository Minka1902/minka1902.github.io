import { useState } from 'react';
import { Dog, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBusiness, useLitters, useWaitlist } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import type { Litter, LitterPuppy, PuppyStatus, WaitlistStatus } from '@/types';

const PUPPY_BADGE: Record<PuppyStatus, 'secondary' | 'outline' | 'default'> = {
  available: 'secondary', reserved: 'default', sold: 'outline',
};

const WAITLIST_LABELS: Record<WaitlistStatus, string> = {
  waiting: 'Waiting', offered: 'Offered', reserved: 'Reserved', fulfilled: 'Fulfilled', cancelled: 'Cancelled',
};

export default function BreedingPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const currency = activeBusiness?.currency ?? 'USD';
  const { litters, loading, createLitter, updateLitter, deleteLitter, reservePuppy } = useLitters(bid);
  const { waitlist, setWaitlistStatus, deleteWaitlistEntry } = useWaitlist(bid);

  const [addOpen, setAddOpen] = useState(false);
  const [breed, setBreed] = useState('');
  const [damName, setDamName] = useState('');
  const [sireName, setSireName] = useState('');
  const [bornAt, setBornAt] = useState('');
  const [expectedAt, setExpectedAt] = useState('');
  const [puppies, setPuppies] = useState<LitterPuppy[]>([]);
  const [reserving, setReserving] = useState<{ litter: Litter; puppyId: string } | null>(null);
  const [reserveName, setReserveName] = useState('');
  const [deposit, setDeposit] = useState('');

  const canView = can('view_breeding');
  const canManage = can('manage_breeding');

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canView && !canManage) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to breeding.</div>;
  }

  const addPuppy = () =>
    setPuppies(prev => [...prev, { id: `p${prev.length + 1}_${Date.now()}`, sex: 'male', status: 'available' }]);
  const setPuppy = (i: number, patch: Partial<LitterPuppy>) =>
    setPuppies(prev => prev.map((p, idx) => idx === i ? { ...p, ...patch } : p));

  const submitLitter = async () => {
    if (!breed.trim() || !damName.trim() || !sireName.trim()) return;
    await createLitter({
      breed: breed.trim(),
      damName: damName.trim(),
      sireName: sireName.trim(),
      bornAt: bornAt || undefined,
      expectedAt: expectedAt || undefined,
      puppies,
    });
    setAddOpen(false);
    setBreed(''); setDamName(''); setSireName(''); setBornAt(''); setExpectedAt(''); setPuppies([]);
  };

  const confirmReserve = async () => {
    if (!reserving || !reserveName.trim()) return;
    await reservePuppy(reserving.litter, reserving.puppyId, reserveName.trim(),
      deposit !== '' ? Number(deposit) : undefined);
    setReserving(null);
    setReserveName('');
    setDeposit('');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Litters &amp; waitlist</h1>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New litter
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : litters.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Dog className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No litters</p>
            <p className="mt-1 text-sm text-muted-foreground">Record a litter — available puppies show in the directory.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {litters.map(litter => (
            <Card key={litter.id}>
              <CardContent className="space-y-2 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{litter.breed}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {litter.damName} × {litter.sireName}
                      {litter.bornAt ? ` · born ${litter.bornAt}` : litter.expectedAt ? ` · expected ${litter.expectedAt}` : ''}
                    </p>
                  </div>
                  {canManage && (
                    <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm('Delete this litter?')) void deleteLitter(litter.id); }} aria-label="Delete litter">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {litter.puppies.map(p => (
                    <div key={p.id} className="flex items-center gap-1">
                      <Badge variant={PUPPY_BADGE[p.status]}>
                        {p.name ?? `${p.sex === 'male' ? '♂' : '♀'}${p.color ? ` ${p.color}` : ''}`} · {p.status}
                      </Badge>
                      {canManage && p.status === 'available' && (
                        <Button size="xs" variant="outline" onClick={() => setReserving({ litter, puppyId: p.id })}>
                          Reserve
                        </Button>
                      )}
                      {canManage && p.status === 'reserved' && (
                        <Button size="xs" variant="outline" onClick={() => {
                          const next = litter.puppies.map(x => x.id === p.id ? { ...x, status: 'sold' as const } : x);
                          void updateLitter(litter.id, { puppies: next });
                        }}>
                          Mark sold
                        </Button>
                      )}
                    </div>
                  ))}
                  {litter.puppies.length === 0 && <p className="text-xs text-muted-foreground">No puppies recorded.</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Waitlist ({waitlist.filter(w => w.status === 'waiting').length} waiting)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {waitlist.length === 0 && (
            <p className="text-sm text-muted-foreground">Customers join from your directory page; position follows join order.</p>
          )}
          {waitlist.map((entry, i) => (
            <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
              <div>
                <p className="font-medium">#{i + 1} {entry.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.preferences?.sex ? `${entry.preferences.sex} · ` : ''}
                  {entry.preferences?.color ? `${entry.preferences.color} · ` : ''}
                  {entry.preferences?.timing ?? ''}
                  {entry.customerEmail ? ` · ${entry.customerEmail}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant={entry.status === 'waiting' ? 'outline' : 'secondary'}>{WAITLIST_LABELS[entry.status]}</Badge>
                {canManage && entry.status === 'waiting' && (
                  <Button size="sm" variant="outline" onClick={() => void setWaitlistStatus(entry, 'offered')}>Offer</Button>
                )}
                {canManage && entry.status === 'offered' && (
                  <Button size="sm" variant="outline" onClick={() => void setWaitlistStatus(entry, 'reserved')}>Reserve</Button>
                )}
                {canManage && entry.status === 'reserved' && (
                  <Button size="sm" variant="outline" onClick={() => void setWaitlistStatus(entry, 'fulfilled')}>Fulfil</Button>
                )}
                {canManage && (
                  <Button variant="ghost" size="icon-sm" onClick={() => void deleteWaitlistEntry(entry.id)} aria-label="Remove from waitlist">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New litter</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="litter-breed">Breed <span className="text-destructive">*</span></Label>
              <Input id="litter-breed" value={breed} onChange={e => setBreed(e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="litter-dam">Dam <span className="text-destructive">*</span></Label>
                <Input id="litter-dam" value={damName} onChange={e => setDamName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="litter-sire">Sire <span className="text-destructive">*</span></Label>
                <Input id="litter-sire" value={sireName} onChange={e => setSireName(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="litter-born">Born</Label>
                <Input id="litter-born" type="date" value={bornAt} onChange={e => setBornAt(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="litter-expected">Expected</Label>
                <Input id="litter-expected" type="date" value={expectedAt} onChange={e => setExpectedAt(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Puppies</Label>
              {puppies.map((p, i) => (
                <div key={p.id} className="grid grid-cols-12 items-center gap-2">
                  <Input className="col-span-4" value={p.name ?? ''} onChange={e => setPuppy(i, { name: e.target.value || undefined })} placeholder="Name (optional)" aria-label={`Puppy ${i + 1} name`} />
                  <div className="col-span-3">
                    <Select value={p.sex} onValueChange={v => setPuppy(i, { sex: v as 'male' | 'female' })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input className="col-span-4" value={p.color ?? ''} onChange={e => setPuppy(i, { color: e.target.value || undefined })} placeholder="Color" aria-label={`Puppy ${i + 1} color`} />
                  <button type="button" onClick={() => setPuppies(prev => prev.filter((_, idx) => idx !== i))} className="col-span-1 flex justify-center text-muted-foreground hover:text-destructive" aria-label="Remove puppy">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addPuppy} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <Plus className="h-4 w-4" /> Add puppy
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={submitLitter} disabled={!breed.trim() || !damName.trim() || !sireName.trim()}>Create litter</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reserving} onOpenChange={o => { if (!o) setReserving(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reserve puppy</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reserve-name">Customer name <span className="text-destructive">*</span></Label>
              <Input id="reserve-name" value={reserveName} onChange={e => setReserveName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reserve-deposit">Deposit ({currency})</Label>
              <Input id="reserve-deposit" type="number" min="0" step="0.01" value={deposit} onChange={e => setDeposit(e.target.value)} placeholder="Optional — raises an invoice" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReserving(null)}>Cancel</Button>
              <Button onClick={confirmReserve} disabled={!reserveName.trim()}>Reserve</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
