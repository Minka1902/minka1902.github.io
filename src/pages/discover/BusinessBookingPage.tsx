import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, CheckCircle2, Globe, Mail, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDirectoryEntry, useBooking } from '@/hooks/useDirectory';
import { BUSINESS_TYPES } from '@/types';

const TYPE_LABELS = Object.fromEntries(BUSINESS_TYPES.map(t => [t.type, t.label]));
const DURATIONS = [30, 45, 60, 90, 120];
const OTHER = '__other__';

function toLocalMin(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000); // default: an hour from now
  d.setSeconds(0, 0);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export default function BusinessBookingPage() {
  const { bid } = useParams<{ bid: string }>();
  const { entry, loading } = useDirectoryEntry(bid);
  const { book } = useBooking();

  const [service, setService] = useState('');
  const [customService, setCustomService] = useState('');
  const [start, setStart] = useState(toLocalMin());
  const [duration, setDuration] = useState(60);
  const [petName, setPetName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const services = entry?.services ?? [];
  const usingCustom = services.length === 0 || service === OTHER;
  const effectiveService = usingCustom ? customService.trim() : service;

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bid || !effectiveService || !start) return;
    setSubmitting(true);
    setError(null);
    try {
      const startAt = new Date(start).getTime();
      await book(bid, {
        serviceLabel: effectiveService,
        startAt,
        endAt: startAt + duration * 60 * 1000,
        petName: petName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setDone(true);
    } catch {
      setError('Could not submit your booking. Please try again.');
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
      <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
        <Link to="/discover"><ArrowLeft className="h-4 w-4" /> Discover</Link>
      </Button>

      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{entry.name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{TYPE_LABELS[entry.type] ?? entry.type}</p>
      </div>

      {entry.description && <p className="text-sm text-muted-foreground">{entry.description}</p>}

      <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        {(entry.location?.label || entry.city) && (
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {entry.location?.label ?? entry.city}</p>
        )}
        {entry.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {entry.phone}</p>}
        {entry.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {entry.email}</p>}
        {entry.website && (
          <p className="flex items-center gap-2"><Globe className="h-4 w-4" />
            <a href={entry.website} target="_blank" rel="noreferrer" className="underline">{entry.website}</a>
          </p>
        )}
      </div>

      {!entry.bookable ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            This business doesn't accept online bookings. Reach out using the contact details above.
          </CardContent>
        </Card>
      ) : done ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <div>
              <p className="font-semibold">Booking requested</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {entry.name} will confirm your appointment. You'll see it once they accept.
              </p>
            </div>
            <Button asChild variant="outline" size="sm"><Link to="/discover">Back to discover</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarPlus className="h-4 w-4" /> Request an appointment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBook} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Service <span className="text-destructive">*</span></Label>
                {services.length > 0 ? (
                  <Select value={service} onValueChange={setService}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Choose a service" /></SelectTrigger>
                    <SelectContent>
                      {services.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      <SelectItem value={OTHER}>Other…</SelectItem>
                    </SelectContent>
                  </Select>
                ) : null}
                {usingCustom && (
                  <Input
                    value={customService}
                    onChange={e => setCustomService(e.target.value)}
                    placeholder="Describe the service you need"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="book-start">Date &amp; time <span className="text-destructive">*</span></Label>
                  <Input id="book-start" type="datetime-local" value={start} onChange={e => setStart(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Duration</Label>
                  <Select value={String(duration)} onValueChange={v => setDuration(Number(v))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map(d => <SelectItem key={d} value={String(d)}>{d} min</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="book-pet">Pet name</Label>
                <Input id="book-pet" value={petName} onChange={e => setPetName(e.target.value)} placeholder="Optional" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="book-notes">Notes</Label>
                <Textarea id="book-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Anything the business should know" />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={submitting || !effectiveService || !start}>
                {submitting ? 'Requesting…' : 'Request appointment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
