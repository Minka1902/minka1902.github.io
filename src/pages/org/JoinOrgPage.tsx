import { useState } from 'react';
import { Search, PawPrint, Check, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOrg } from '@/contexts/OrgContext';
import { useDog } from '@/contexts/DogContext';
import { useAuth } from '@/hooks/useAuth';
import OrgCard from '@/components/org/OrgCard';
import { searchOrgs, useOrgPendingMembers, enrollDogInOrg } from '@/hooks/useOrg';
import type { Organization } from '@/types';

// ─── Join button (per org result) ─────────────────────────────────────────────

function JoinButton({ org, onJoined }: { org: Organization; onJoined: (orgId: string) => void }) {
  const { user } = useAuth();
  const { requestJoin } = useOrgPendingMembers(org.id);
  const { orgs } = useOrg();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const alreadyMember = orgs.some(o => o.id === org.id);
  const alreadyLeader = org.leaderUserIds.includes(user?.uid ?? '');

  if (alreadyMember || alreadyLeader) {
    return <span className="text-xs text-muted-foreground">Already a member</span>;
  }

  const handleJoin = async () => {
    setStatus('loading');
    try {
      await requestJoin(org.id);
      setStatus('done');
      onJoined(org.id);
    } catch {
      setStatus('error');
    }
  };

  if (status === 'done') return <span className="text-xs text-green-600">Request sent!</span>;
  if (status === 'error') return <span className="text-xs text-destructive">Failed to send request.</span>;

  return (
    <Button size="sm" onClick={handleJoin} disabled={status === 'loading'}>
      {status === 'loading' ? 'Sending…' : 'Request to Join'}
    </Button>
  );
}

// ─── Dog enrollment step ──────────────────────────────────────────────────────

function DogEnrollmentStep({ orgId, onDone }: { orgId: string; onDone: () => void }) {
  const { user } = useAuth();
  const { dogs } = useDog();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState(false);
  const [done, setDone] = useState(false);

  const myDogs = dogs.filter(d => d.mainHumanId === user?.uid);

  const toggle = (dogId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(dogId) ? next.delete(dogId) : next.add(dogId);
      return next;
    });
  };

  const handleEnroll = async () => {
    if (!user || selected.size === 0) { onDone(); return; }
    setEnrolling(true);
    try {
      await Promise.all(
        [...selected].map(dogId => {
          const dog = dogs.find(d => d.id === dogId)!;
          return enrollDogInOrg(orgId, dog, user);
        })
      );
      setDone(true);
    } finally {
      setEnrolling(false);
    }
  };

  if (done) {
    return (
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-5 w-5" />
            <p className="text-sm font-semibold">
              {selected.size} dog{selected.size !== 1 ? 's' : ''} enrolled!
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onDone}>Done</Button>
        </CardContent>
      </Card>
    );
  }

  if (myDogs.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        <div>
          <p className="text-sm font-semibold">Enroll your dogs</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select which dogs you'd like to enroll in this organization.
          </p>
        </div>

        <div className="space-y-2">
          {myDogs.map(dog => (
            <button
              key={dog.id}
              type="button"
              onClick={() => toggle(dog.id)}
              className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                selected.has(dog.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                {dog.photoURL
                  ? <img src={dog.photoURL} alt={dog.name} className="h-full w-full rounded-full object-cover" />
                  : <PawPrint className="h-4 w-4 text-amber-600" />
                }
              </div>
              <span className="flex-1 text-sm font-medium capitalize">{dog.name}</span>
              {selected.has(dog.id) && <Check className="h-4 w-4 text-primary shrink-0" />}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleEnroll}
            disabled={enrolling || selected.size === 0}
          >
            {enrolling ? 'Enrolling…' : `Enroll${selected.size > 0 ? ` (${selected.size})` : ''}`}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDone}>
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function JoinOrgPage() {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<Organization[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [joinedOrgId, setJoinedOrgId] = useState<string | null>(null);
  const [enrollmentDone, setEnrollmentDone] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim()) return;
    setSearching(true);
    setJoinedOrgId(null);
    setEnrollmentDone(false);
    const found = await searchOrgs(term.trim());
    setResults(found);
    setSearching(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Find Organization</h1>

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search by organization name…"
              value={term}
              onChange={e => {
                setTerm(e.target.value);
                setResults(null);
                setJoinedOrgId(null);
                setEnrollmentDone(false);
              }}
              autoComplete="off"
              className="flex-1"
            />
            <Button type="submit" variant="outline" size="icon" disabled={searching} aria-label="Search">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Dog enrollment step (shown after join request sent) */}
      {joinedOrgId && !enrollmentDone && (
        <DogEnrollmentStep orgId={joinedOrgId} onDone={() => setEnrollmentDone(true)} />
      )}

      {results !== null && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No organizations found matching "{term}". Only existing organizations can be joined.
            </p>
          ) : (
            results.map(org => (
              <div key={org.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <OrgCard org={org} />
                </div>
                <div className="shrink-0">
                  <JoinButton
                    org={org}
                    onJoined={id => { setJoinedOrgId(id); setEnrollmentDone(false); }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {joinedOrgId && enrollmentDone && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ChevronRight className="h-4 w-4" />
          Your join request has been sent. The org will need to approve you.
        </div>
      )}
    </div>
  );
}
