import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Dog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDirectoryEntry, useJoinWaitlist, usePublicLitters } from '@/hooks/useDirectory';

const ANY = '__any__';

export default function BusinessLittersPage() {
  const { bid } = useParams<{ bid: string }>();
  const { entry, loading } = useDirectoryEntry(bid);
  const { litters, loading: littersLoading } = usePublicLitters(bid);
  const { joinWaitlist } = useJoinWaitlist();

  const [sex, setSex] = useState<string>(ANY);
  const [color, setColor] = useState('');
  const [timing, setTiming] = useState('');
  const [phone, setPhone] = useState('');
  const [joined, setJoined] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const join = async () => {
    if (!bid) return;
    setSubmitting(true);
    try {
      await joinWaitlist(bid, entry, {
        phone: phone.trim() || undefined,
        preferences: {
          sex: sex !== ANY ? (sex as 'male' | 'female') : undefined,
          color: color.trim() || undefined,
          timing: timing.trim() || undefined,
        },
      });
      setJoined(true);
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
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Litters at {entry.name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Join the waitlist — the breeder reaches out in order.</p>
      </div>

      {littersLoading ? (
        <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : litters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Dog className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No litters with available puppies right now — join the waitlist below.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {litters.map(l => (
            <Card key={l.id}>
              <CardContent className="flex items-center justify-between gap-3 p-3 text-sm">
                <div>
                  <p className="font-medium">{l.breed}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.bornAt ? `born ${l.bornAt}` : l.expectedAt ? `expected ${l.expectedAt}` : ''}
                  </p>
                </div>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {l.availableCount} available
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {joined ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <div>
              <p className="font-semibold">You're on the waitlist</p>
              <p className="mt-1 text-sm text-muted-foreground">{entry.name} will message you when a puppy matches.</p>
            </div>
            <Button render={<Link to="/discover" />} variant="outline" size="sm">Back to discover</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Join the waitlist</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Preferred sex</Label>
                <Select value={sex} onValueChange={v => setSex(v ?? ANY)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>No preference</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wl-color">Preferred color</Label>
                <Input id="wl-color" value={color} onChange={e => setColor(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="wl-timing">When are you looking?</Label>
                <Input id="wl-timing" value={timing} onChange={e => setTiming(e.target.value)} placeholder="e.g. this summer" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wl-phone">Phone</Label>
                <Input id="wl-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <Button className="w-full" onClick={join} disabled={submitting}>
              {submitting ? 'Joining…' : 'Join waitlist'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
