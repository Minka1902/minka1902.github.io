import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BedDouble, CalendarPlus, CheckCircle2, Dog, Globe, GraduationCap, HeartHandshake, Mail, MapPin, Phone, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDirectoryEntry, useBooking, usePurchasePackage, useReviews } from '@/hooks/useDirectory';
import { generateSlots, dayStartOffset } from '@/lib/availability';
import { BUSINESS_TYPES, DEFAULT_SLOT_MINUTES } from '@/types';

const TYPE_LABELS = Object.fromEntries(BUSINESS_TYPES.map(t => [t.type, t.label]));
const DURATIONS = [30, 45, 60, 90, 120];
const OTHER = '__other__';
const DAYS_AHEAD = 14;

function toLocalMin(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000); // default: an hour from now
  d.setSeconds(0, 0);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

const fmtSlot = (ms: number) =>
  new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export default function BusinessBookingPage() {
  const { bid } = useParams<{ bid: string }>();
  const { entry, loading } = useDirectoryEntry(bid);
  const { book } = useBooking();
  const { purchasePackage } = usePurchasePackage();
  const [boughtPackageId, setBoughtPackageId] = useState<string | null>(null);
  const { reviews, myReview, submitReview } = useReviews(bid);
  const [myRating, setMyRating] = useState(0);
  const [myReviewText, setMyReviewText] = useState('');
  const [reviewSaved, setReviewSaved] = useState(false);

  const [service, setService] = useState('');
  const [customService, setCustomService] = useState('');
  const [start, setStart] = useState(toLocalMin());
  const [duration, setDuration] = useState(60);
  const [dayOffset, setDayOffset] = useState(0);
  const [slotStart, setSlotStart] = useState<number | null>(null);
  const [petName, setPetName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefer the priced service menu when the business published one; fall back
  // to the legacy plain service names.
  const menu = entry?.serviceMenu ?? [];
  const services = menu.length ? menu.map(m => m.name) : (entry?.services ?? []);
  const usingCustom = services.length === 0 || service === OTHER;
  const effectiveService = usingCustom ? customService.trim() : service;
  const chosenMenuItem = menu.find(m => m.name === service);

  // When the business publishes opening hours, customers pick a free slot rather
  // than a raw date/time — so they can only book when the business is open & free.
  const hasAvailability = !!entry?.availability?.some(Boolean);
  const slotMin = entry?.slotMinutes ?? DEFAULT_SLOT_MINUTES;
  const slots = useMemo(
    () => (hasAvailability
      ? generateSlots(dayStartOffset(dayOffset), entry?.availability, slotMin, entry?.busySlots ?? [])
      : []),
    [hasAvailability, dayOffset, entry?.availability, entry?.busySlots, slotMin],
  );

  const canSubmit = !!effectiveService && (hasAvailability ? slotStart !== null : !!start);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bid || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const startAt = hasAvailability ? slotStart! : new Date(start).getTime();
      // A published service duration wins over the generic slot/duration length.
      const minutes = chosenMenuItem?.durationMinutes ?? (hasAvailability ? slotMin : duration);
      const endAt = startAt + minutes * 60_000;
      await book(bid, {
        serviceLabel: effectiveService,
        startAt,
        endAt,
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
        <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{TYPE_LABELS[entry.type] ?? entry.type}</span>
          {reviews.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)} ({reviews.length})
            </span>
          )}
        </p>
      </div>

      {entry.description && <p className="text-sm text-muted-foreground">{entry.description}</p>}

      {(entry.orderable || entry.boarding?.requestsOpen ||
        entry.type === 'trainer' || entry.type === 'shelter' || entry.type === 'breeder') && (
        <div className="flex flex-wrap gap-2">
          {entry.orderable && (
            <Button render={<Link to={`/discover/${bid}/order`} />} variant="outline" size="sm" className="gap-1.5">
              <ShoppingCart className="h-4 w-4" /> Order products
            </Button>
          )}
          {entry.boarding?.requestsOpen && (
            <Button render={<Link to={`/discover/${bid}/boarding`} />} variant="outline" size="sm" className="gap-1.5">
              <BedDouble className="h-4 w-4" /> Request a stay
            </Button>
          )}
          {entry.type === 'trainer' && (
            <Button render={<Link to={`/discover/${bid}/classes`} />} variant="outline" size="sm" className="gap-1.5">
              <GraduationCap className="h-4 w-4" /> Group classes
            </Button>
          )}
          {entry.type === 'shelter' && (
            <Button render={<Link to={`/discover/${bid}/adopt`} />} variant="outline" size="sm" className="gap-1.5">
              <HeartHandshake className="h-4 w-4" /> Adopt
            </Button>
          )}
          {entry.type === 'breeder' && (
            <Button render={<Link to={`/discover/${bid}/litters`} />} variant="outline" size="sm" className="gap-1.5">
              <Dog className="h-4 w-4" /> Litters &amp; waitlist
            </Button>
          )}
        </div>
      )}

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

      {entry.packages && entry.packages.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Packages &amp; memberships</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {entry.packages.map(p => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.credits} credits · {p.price.toFixed(2)} {entry.currency ?? ''}
                    {p.validityDays ? ` · valid ${p.validityDays} days` : ''}
                    {p.description ? ` — ${p.description}` : ''}
                  </p>
                </div>
                {boughtPackageId === p.id ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> Purchased
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await purchasePackage(bid!, entry, p);
                        setBoughtPackageId(p.id);
                      } catch { /* surfaced by the unchanged button state */ }
                    }}
                  >
                    Buy
                  </Button>
                )}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Payment is settled with the business directly; credits appear on their side right away.
            </p>
          </CardContent>
        </Card>
      )}

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
                      {services.map(s => {
                        const item = menu.find(m => m.name === s);
                        return (
                          <SelectItem key={s} value={s}>
                            {s}
                            {item ? ` — ${item.price.toFixed(2)} ${entry.currency ?? ''}${item.durationMinutes ? ` · ${item.durationMinutes} min` : ''}` : ''}
                          </SelectItem>
                        );
                      })}
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

              {hasAvailability ? (
                <div className="space-y-2">
                  <Label>Pick a free slot <span className="text-destructive">*</span></Label>
                  {/* Day selector */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {Array.from({ length: DAYS_AHEAD }, (_, i) => i).map(off => {
                      const d = new Date(dayStartOffset(off));
                      const active = off === dayOffset;
                      return (
                        <button
                          key={off}
                          type="button"
                          onClick={() => { setDayOffset(off); setSlotStart(null); }}
                          className={`flex shrink-0 flex-col items-center rounded-lg border px-2.5 py-1.5 text-xs ${active ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground'}`}
                        >
                          <span>{d.toLocaleDateString([], { weekday: 'short' })}</span>
                          <span className="font-semibold">{d.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Slot grid */}
                  {slots.length === 0 ? (
                    <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                      No free slots that day. Try another date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {slots.map(s => (
                        <button
                          key={s.start}
                          type="button"
                          onClick={() => setSlotStart(s.start)}
                          className={`rounded-lg border py-1.5 text-sm ${slotStart === s.start ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                        >
                          {fmtSlot(s.start)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
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
              )}

              <div className="space-y-1.5">
                <Label htmlFor="book-pet">Pet name</Label>
                <Input id="book-pet" value={petName} onChange={e => setPetName(e.target.value)} placeholder="Optional" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="book-notes">Notes</Label>
                <Textarea id="book-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Anything the business should know" />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={submitting || !canSubmit}>
                {submitting ? 'Requesting…' : 'Request appointment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4" /> Reviews
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>}

          {reviews.slice(0, 5).map(r => (
            <div key={r.id} className="space-y-0.5 text-sm">
              <p className="flex items-center gap-1.5 font-medium">
                {r.authorName}
                <span className="inline-flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                  ))}
                </span>
              </p>
              {r.text && <p className="text-muted-foreground">{r.text}</p>}
            </div>
          ))}

          <div className="space-y-2 rounded-lg border border-dashed p-3">
            <p className="text-sm font-medium">{myReview ? 'Update your review' : 'Leave a review'}</p>
            <div className="flex gap-1">
              {Array.from({ length: 5 }, (_, i) => i + 1).map(n => (
                <button key={n} type="button" onClick={() => { setMyRating(n); setReviewSaved(false); }} aria-label={`${n} star${n !== 1 ? 's' : ''}`}>
                  <Star className={`h-6 w-6 ${n <= (myRating || myReview?.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />
                </button>
              ))}
            </div>
            <Textarea
              value={myReviewText || myReview?.text || ''}
              onChange={e => { setMyReviewText(e.target.value); setReviewSaved(false); }}
              rows={2}
              placeholder="How was your experience?"
            />
            <Button
              size="sm"
              disabled={!(myRating || myReview?.rating)}
              onClick={async () => {
                await submitReview(myRating || myReview!.rating, myReviewText || myReview?.text);
                setReviewSaved(true);
              }}
            >
              {reviewSaved ? 'Saved!' : 'Submit review'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
