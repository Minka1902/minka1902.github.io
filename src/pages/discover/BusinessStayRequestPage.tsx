import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BedDouble, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDirectoryEntry, useRequestStay } from '@/hooks/useDirectory';
import { addDays, stayNights, todayStr } from '@/lib/occupancy';
import type { StayMedication } from '@/types';

export default function BusinessStayRequestPage() {
  const { bid } = useParams<{ bid: string }>();
  const { entry, loading } = useDirectoryEntry(bid);
  const { requestStay } = useRequestStay();

  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState<'dog' | 'cat' | 'other'>('dog');
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(addDays(todayStr(), 1));
  const [foodProvidedBy, setFoodProvidedBy] = useState<'owner' | 'business'>('owner');
  const [feedingTimes, setFeedingTimes] = useState('');
  const [foodAmount, setFoodAmount] = useState('');
  const [medications, setMedications] = useState<StayMedication[]>([]);
  const [careInstructions, setCareInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullDates = entry?.boarding?.fullDates ?? [];
  const pricePerNight = entry?.boarding?.pricePerNight;
  const currency = entry?.currency ?? '';

  // Client-side guard against full dates; the business re-checks capacity at
  // approval time, so this is purely a better-UX early warning.
  const nights = endDate >= startDate ? stayNights(startDate, endDate) : [];
  const blockedNights = nights.filter(n => fullDates.includes(n));
  const validRange = endDate >= startDate && startDate >= todayStr();
  const canSubmit = !!petName.trim() && validRange && blockedNights.length === 0;

  const setMed = (i: number, patch: Partial<StayMedication>) =>
    setMedications(prev => prev.map((m, idx) => idx === i ? { ...m, ...patch } : m));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bid || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const times = feedingTimes.split(',').map(t => t.trim()).filter(Boolean);
      await requestStay(bid, entry!, {
        petName: petName.trim(),
        petSpecies,
        startDate,
        endDate,
        foodPlan: {
          providedBy: foodProvidedBy,
          feedingTimes: times.length ? times : undefined,
          amount: foodAmount.trim() || undefined,
        },
        medications: medications.filter(m => m.name.trim()).map(m => ({
          name: m.name.trim(), dosage: m.dosage?.trim() || undefined, schedule: m.schedule?.trim() || undefined,
        })),
        careInstructions: careInstructions.trim() || undefined,
      });
      setDone(true);
    } catch {
      setError('Could not submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="mx-auto max-w-xl space-y-5 p-1 sm:p-2">
      <Button render={<Link to={`/discover/${bid}`} />} variant="ghost" size="sm" className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> {entry.name}
      </Button>

      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Request a stay at {entry.name}</h1>
        {pricePerNight != null && (
          <p className="mt-0.5 text-sm text-muted-foreground">{pricePerNight.toFixed(2)} {currency} per night</p>
        )}
      </div>

      {!entry.boarding?.requestsOpen ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            This business doesn't take online stay requests right now.
          </CardContent>
        </Card>
      ) : done ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <div>
              <p className="font-semibold">Stay requested</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {entry.name} must approve your request — they'll have your food plan and care notes ready.
              </p>
            </div>
            <Button render={<Link to="/discover" />} variant="outline" size="sm">Back to discover</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BedDouble className="h-4 w-4" /> Your dog's stay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="stay-pet">Pet name <span className="text-destructive">*</span></Label>
                  <Input id="stay-pet" value={petName} onChange={e => setPetName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Species</Label>
                  <Select value={petSpecies} onValueChange={v => setPetSpecies(v as 'dog' | 'cat' | 'other')}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="stay-start">Check-in <span className="text-destructive">*</span></Label>
                  <Input id="stay-start" type="date" value={startDate} min={todayStr()} onChange={e => setStartDate(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="stay-end">Check-out <span className="text-destructive">*</span></Label>
                  <Input id="stay-end" type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} required />
                </div>
              </div>

              {blockedNights.length > 0 && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Fully booked on {blockedNights.join(', ')} — try different dates.
                </p>
              )}
              {pricePerNight != null && nights.length > 0 && blockedNights.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {nights.length} night{nights.length !== 1 ? 's' : ''} · estimated {(nights.length * pricePerNight).toFixed(2)} {currency}
                </p>
              )}

              <div className="space-y-2 rounded-lg border p-3">
                <Label>Food</Label>
                <Select value={foodProvidedBy} onValueChange={v => setFoodProvidedBy(v as 'owner' | 'business')}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">I'll bring my dog's food</SelectItem>
                    <SelectItem value="business">Please provide food</SelectItem>
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input value={feedingTimes} onChange={e => setFeedingTimes(e.target.value)} placeholder="Feeding times, e.g. 08:00, 18:00" aria-label="Feeding times" />
                  <Input value={foodAmount} onChange={e => setFoodAmount(e.target.value)} placeholder="Amount, e.g. 1 cup kibble" aria-label="Food amount" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Medications</Label>
                {medications.map((m, i) => (
                  <div key={i} className="grid grid-cols-12 items-center gap-2">
                    <Input className="col-span-4" value={m.name} onChange={e => setMed(i, { name: e.target.value })} placeholder="Name" aria-label={`Medication ${i + 1} name`} />
                    <Input className="col-span-3" value={m.dosage ?? ''} onChange={e => setMed(i, { dosage: e.target.value })} placeholder="Dosage" aria-label={`Medication ${i + 1} dosage`} />
                    <Input className="col-span-4" value={m.schedule ?? ''} onChange={e => setMed(i, { schedule: e.target.value })} placeholder="Schedule" aria-label={`Medication ${i + 1} schedule`} />
                    <button type="button" onClick={() => setMedications(prev => prev.filter((_, idx) => idx !== i))} className="col-span-1 flex justify-center text-muted-foreground hover:text-destructive" aria-label="Remove medication">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setMedications(prev => [...prev, { name: '' }])} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                  <Plus className="h-4 w-4" /> Add medication
                </button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stay-care">Care instructions</Label>
                <Textarea id="stay-care" value={careInstructions} onChange={e => setCareInstructions(e.target.value)} rows={2} placeholder="Walks, quirks, fears…" />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={submitting || !canSubmit}>
                {submitting ? 'Requesting…' : 'Request stay'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
