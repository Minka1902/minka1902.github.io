import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useDirectoryEntry, useEnrollInClass, usePublicClasses } from '@/hooks/useDirectory';

export default function BusinessClassesPage() {
  const { bid } = useParams<{ bid: string }>();
  const { entry, loading } = useDirectoryEntry(bid);
  const { classes, loading: classesLoading } = usePublicClasses(bid);
  const { enroll } = useEnrollInClass();

  const [petName, setPetName] = useState('');
  const [result, setResult] = useState<Record<string, 'enrolled' | 'waitlisted'>>({});

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
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Classes at {entry.name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Enroll your dog — full classes take a waitlist.</p>
      </div>

      <div className="space-y-1.5">
        <Input value={petName} onChange={e => setPetName(e.target.value)} placeholder="Your dog's name" aria-label="Dog name" />
      </div>

      {classesLoading ? (
        <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <GraduationCap className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No open classes right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {classes.map(cls => (
            <Card key={cls.id}>
              <CardContent className="space-y-2 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {cls.name}
                      <Badge variant={cls.spotsLeft > 0 ? 'secondary' : 'outline'}>
                        {cls.spotsLeft > 0 ? `${cls.spotsLeft} spot${cls.spotsLeft !== 1 ? 's' : ''} left` : 'Waitlist'}
                      </Badge>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {cls.sessions.map(s => `${s.date} ${s.start}–${s.end}`).join(' · ')}
                      {cls.price != null ? ` · ${cls.price.toFixed(2)} ${entry.currency ?? ''}` : ''}
                    </p>
                    {cls.description && <p className="mt-1 text-sm text-muted-foreground">{cls.description}</p>}
                  </div>
                  {result[cls.id] ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> {result[cls.id] === 'enrolled' ? 'Enrolled' : 'On waitlist'}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      disabled={!petName.trim()}
                      onClick={async () => {
                        const status = await enroll(bid!, entry, cls, petName.trim());
                        setResult(prev => ({ ...prev, [cls.id]: status }));
                      }}
                    >
                      {cls.spotsLeft > 0 ? 'Enroll' : 'Join waitlist'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
