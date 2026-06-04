import { useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, UserPlus, Clock, Search, Building2 } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import { useHumans, usePendingHumans } from '@/hooks/useHumans';
import { useBusinessDirectory } from '@/hooks/useDirectory';
import { useAuth } from '@/hooks/useAuth';
import { isTeamEligibleBusiness } from '@/types';
import HumanCard from '@/components/humans/HumanCard';
import { Skeleton } from '@/components/ui/skeleton';
import PendingRequestCard from '@/components/humans/PendingRequestCard';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { HUMAN_ROLES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { HumanRole, UserProfile } from '@/types';

export default function HumansPage() {
  const { activeDog, isMainHuman } = useDog();
  const { user } = useAuth();
  const dogId = activeDog?.id ?? '';
  const { humans, loading: humansLoading, revokeHuman, addBusinessToTeam } = useHumans(dogId);
  const { pending, approveHuman, rejectHuman, addHumanDirectly } = usePendingHumans(dogId);
  const isMain = isMainHuman(dogId);

  const { results: directory } = useBusinessDirectory(null);
  const [bizSearch, setBizSearch] = useState('');
  const bizMatches = bizSearch.trim()
    ? directory
        .filter(b => isTeamEligibleBusiness(b.type))
        .filter(b => b.name.toLowerCase().includes(bizSearch.trim().toLowerCase()))
        .filter(b => !humans.some(h => h.businessId === b.id))
        .slice(0, 5)
    : [];

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<UserProfile | null | 'not-found'>(null);
  const [searching, setSearching] = useState(false);
  const [addRole, setAddRole] = useState<HumanRole>('caregiver');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;
    setSearching(true);
    setSearchResult(null);
    setAdded(null);

    const usersRef = collection(db, 'users');
    const byEmail = query(usersRef, where('email', '==', term));
    const byPhone = query(usersRef, where('phoneNumber', '==', term));
    const [emailSnap, phoneSnap] = await Promise.all([getDocs(byEmail), getDocs(byPhone)]);
    const docs = [...emailSnap.docs, ...phoneSnap.docs];

    if (docs.length === 0) {
      setSearchResult('not-found');
    } else {
      const found = { uid: docs[0].id, ...docs[0].data() } as UserProfile;
      if (found.uid === user?.uid) {
        setSearchResult('not-found');
      } else {
        setSearchResult(found);
      }
    }
    setSearching(false);
  };

  const handleAdd = async () => {
    if (!searchResult || searchResult === 'not-found') return;
    setAdding(true);
    setAddError(null);
    try {
      await addHumanDirectly(searchResult.uid, searchResult.displayName, searchResult.email, addRole);
      setAdded(searchResult.displayName);
      setSearchResult(null);
      setSearchTerm('');
    } catch (err) {
      setAddError(`Failed to add: ${(err as Error).message}`);
    } finally {
      setAdding(false);
    }
  };

  if (!activeDog) {
    return <div className="text-muted-foreground">No active dog selected.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Team</h1>
        <Link to="/dogs/join" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
          <UserPlus className="h-3.5 w-3.5" /> Join Another Dog
        </Link>
      </div>

      {/* Add caregiver by email/phone (main human only) */}
      {isMain && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm font-medium">Add a team member</p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Email or phone number…"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setSearchResult(null); setAdded(null); }}
                autoComplete="off"
                className="flex-1"
              />
              <Button type="submit" variant="outline" size="icon" disabled={searching} aria-label="Search">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            {added && (
              <p className="text-sm text-green-600 dark:text-green-400">{added} added to the team.</p>
            )}
            {addError && (
              <p className="text-sm text-destructive">{addError}</p>
            )}

            {searchResult === 'not-found' && (
              <p className="text-sm text-muted-foreground">No user found with that email or phone.</p>
            )}

            {searchResult && searchResult !== 'not-found' && (() => {
              const alreadyMember = humans.some(h => h.userId === searchResult.uid);
              return (
                <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold shrink-0">
                    {searchResult.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize truncate">{searchResult.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{searchResult.email}</p>
                  </div>
                  {alreadyMember ? (
                    <p className="text-xs text-muted-foreground">Already a member</p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Select value={addRole} onValueChange={v => setAddRole(v as HumanRole)}>
                        <SelectTrigger className="w-full sm:w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {HUMAN_ROLES.map(r => (
                            <SelectItem key={r.role} value={r.role}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={handleAdd} disabled={adding}>
                        {adding ? 'Adding…' : 'Add'}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Add a business (dog walker, vet, …) to the team */}
      {isMain && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Add a business to the team</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Dog walkers, vets, trainers and other care providers can join {activeDog.name}'s team.
            </p>
            <Input
              placeholder="Search business name…"
              value={bizSearch}
              onChange={e => setBizSearch(e.target.value)}
              autoComplete="off"
            />
            {bizSearch.trim() && bizMatches.length === 0 && (
              <p className="text-sm text-muted-foreground">No eligible business found with that name.</p>
            )}
            {bizMatches.map(b => (
              <div key={b.id} className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  {b.location?.label && <p className="text-xs text-muted-foreground truncate">{b.location.label}</p>}
                </div>
                <Button
                  size="sm"
                  onClick={async () => { await addBusinessToTeam({ id: b.id, name: b.name, type: b.type }); setBizSearch(''); }}
                >
                  Add
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pending requests */}
      {isMain && pending.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {pending.length} pending request{pending.length !== 1 ? 's' : ''}
            </h2>
          </div>
          {pending.map(req => (
            <PendingRequestCard
              key={req.userId}
              request={req}
              onApprove={(userId, displayName, email) =>
                approveHuman(userId, displayName, email, req.requestedRole)
              }
              onReject={rejectHuman}
            />
          ))}
        </div>
      )}

      {/* Team members */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Team Members {!humansLoading && `(${humans.length})`}
        </h2>
        {humansLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : humans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 rounded-xl border border-dashed bg-background gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">Just you so far</p>
              <p className="text-sm text-muted-foreground mt-1">Invite caregivers, trainers, or walkers to join <span className="capitalize">{activeDog.name}</span>'s team.</p>
            </div>
          </div>
        ) : (
          humans.map(human => (
            <HumanCard
              key={human.userId}
              human={human}
              canRevoke={isMain && human.userId !== user?.uid}
              onRevoke={revokeHuman}
            />
          ))
        )}
      </div>
    </div>
  );
}
