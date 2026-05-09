import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Building2, Settings, Users, PawPrint, Globe, Mail, Phone,
  Instagram, Facebook, MapPin, Clock, Search, Trash2,
} from 'lucide-react';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/hooks/useAuth';
import {
  useOrgMembers, useOrgPendingMembers, useOrgActions, getOrgById,
} from '@/hooks/useOrg';
import OrgMemberCard from '@/components/org/OrgMemberCard';
import OrgPendingCard from '@/components/org/OrgPendingCard';
import DogCard from '@/components/dog/DogCard';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { Organization, Dog, UserProfile } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  rescue: 'Rescue', shelter: 'Shelter', breeder: 'Breeder',
  training: 'Training', daycare: 'Daycare', other: 'Other',
};

export default function OrgDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orgs, isOrgAdmin } = useOrg();

  const [org, setOrg] = useState<Organization | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgDogs, setOrgDogs] = useState<Dog[]>([]);

  // Resolve org — from context first, else fetch
  useEffect(() => {
    if (!orgId) return;
    const found = orgs.find(o => o.id === orgId);
    if (found) {
      setOrg(found);
      setOrgLoading(false);
    } else {
      getOrgById(orgId).then(o => {
        setOrg(o);
        setOrgLoading(false);
      });
    }
  }, [orgId, orgs]);

  // Fetch dogs for this org
  useEffect(() => {
    if (!orgId) return;
    getDocs(query(collection(db, 'dogs'), where('orgId', '==', orgId))).then(snap => {
      setOrgDogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Dog)));
    });
  }, [orgId]);

  const id = orgId ?? '';
  const { members } = useOrgMembers(id);
  const { pending, approveMember, rejectMember } = useOrgPendingMembers(id);
  const { removeMember, promoteToAdmin, demoteToMember, inviteMember, addDogToOrg, deleteOrg } = useOrgActions(id);

  const amAdmin = isOrgAdmin(id);

  // Invite by email state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<UserProfile | null | 'not-found'>(null);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;
    setSearching(true);
    setSearchResult(null);
    setInvited(null);
    const snap = await getDocs(query(collection(db, 'users'), where('email', '==', term)));
    const docs = snap.docs;
    if (docs.length === 0) {
      setSearchResult('not-found');
    } else {
      const found = { uid: docs[0].id, ...docs[0].data() } as UserProfile;
      setSearchResult(found.uid === user?.uid ? 'not-found' : found);
    }
    setSearching(false);
  };

  const handleInvite = async () => {
    if (!searchResult || searchResult === 'not-found') return;
    setInviting(true);
    await inviteMember(searchResult.uid, searchResult.displayName, searchResult.email);
    setInvited(searchResult.displayName);
    setSearchResult(null);
    setSearchTerm('');
    setInviting(false);
  };

  const handleDeleteOrg = async () => {
    if (!window.confirm(`Delete "${org?.name}"? This cannot be undone.`)) return;
    await deleteOrg();
    navigate('/orgs');
  };

  if (orgLoading) {
    return <div className="text-muted-foreground p-8">Loading…</div>;
  }
  if (!org) {
    return <div className="text-muted-foreground p-8">Organization not found.</div>;
  }

  const initials = org.name.slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Org header */}
      <div className="flex items-start gap-4">
        {org.logoURL ? (
          <img src={org.logoURL} alt={org.name} className="h-16 w-16 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
            {amAdmin && <Badge className="bg-amber-100 text-amber-800 border-amber-200">Admin</Badge>}
            {org.type && <Badge variant="outline">{TYPE_LABELS[org.type] ?? org.type}</Badge>}
          </div>
          {org.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{org.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {org.memberUserIds.length + org.adminUserIds.length} members
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <PawPrint className="h-3 w-3" />
              {orgDogs.length} dogs
            </span>
          </div>
        </div>
        {amAdmin && (
          <Link
            to={`/orgs/${id}/settings`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5 shrink-0')}
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Link>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">
            Members {pending.length > 0 && amAdmin ? `(${pending.length} pending)` : ''}
          </TabsTrigger>
          <TabsTrigger value="dogs">Dogs</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {(org.email || org.phone || org.website) && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                {org.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`mailto:${org.email}`} className="hover:underline text-foreground">{org.email}</a>
                  </div>
                )}
                {org.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`tel:${org.phone}`} className="hover:underline text-foreground">{org.phone}</a>
                  </div>
                )}
                {org.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-foreground truncate">
                      {org.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {org.instagram && (
                  <div className="flex items-center gap-2 text-sm">
                    <Instagram className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{org.instagram}</span>
                  </div>
                )}
                {org.facebook && (
                  <div className="flex items-center gap-2 text-sm">
                    <Facebook className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{org.facebook}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {org.address && (org.address.street || org.address.city) && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    {org.address.street && <p>{org.address.street}</p>}
                    <p>
                      {[org.address.city, org.address.state, org.address.zip].filter(Boolean).join(', ')}
                    </p>
                    {org.address.country && <p>{org.address.country}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {!org.email && !org.phone && !org.website && !org.address?.city && (
            <p className="text-sm text-muted-foreground">No contact info added yet.</p>
          )}
        </TabsContent>

        {/* Members tab */}
        <TabsContent value="members" className="space-y-4 mt-4">
          {/* Invite by email (admin only) */}
          {amAdmin && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm font-medium">Invite a member</p>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    placeholder="Email address…"
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setSearchResult(null); setInvited(null); }}
                    autoComplete="off"
                    className="flex-1"
                  />
                  <Button type="submit" variant="outline" size="icon" disabled={searching} aria-label="Search">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
                {invited && <p className="text-sm text-green-600">{invited} has been added to the org.</p>}
                {searchResult === 'not-found' && (
                  <p className="text-sm text-muted-foreground">No user found with that email.</p>
                )}
                {searchResult && searchResult !== 'not-found' && (() => {
                  const alreadyMember = members.some(m => m.userId === searchResult.uid);
                  return (
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold shrink-0">
                        {searchResult.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate capitalize">{searchResult.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{searchResult.email}</p>
                      </div>
                      {alreadyMember ? (
                        <span className="text-xs text-muted-foreground">Already a member</span>
                      ) : (
                        <Button size="sm" onClick={handleInvite} disabled={inviting}>
                          {inviting ? 'Adding…' : 'Add'}
                        </Button>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Pending requests */}
          {amAdmin && pending.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-amber-700">
                  {pending.length} pending request{pending.length !== 1 ? 's' : ''}
                </h2>
              </div>
              {pending.map(p => (
                <OrgPendingCard
                  key={p.userId}
                  pending={p}
                  onApprove={approveMember}
                  onReject={rejectMember}
                />
              ))}
            </div>
          )}

          {/* Members list */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Members ({members.length})
            </h2>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet.</p>
            ) : (
              members.map(m => (
                <OrgMemberCard
                  key={m.userId}
                  member={m}
                  canManage={amAdmin}
                  isCurrentUser={m.userId === user?.uid}
                  onRemove={removeMember}
                  onPromote={promoteToAdmin}
                  onDemote={demoteToMember}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* Dogs tab */}
        <TabsContent value="dogs" className="space-y-4 mt-4">
          {orgDogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed bg-background gap-3">
              <PawPrint className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-sm">No dogs linked yet</p>
                {amAdmin && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Go to a dog's edit page and assign it to this organization, or use the{' '}
                    <Link to={`/orgs/${id}/settings`} className="underline">Settings</Link> tab.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {orgDogs.map(dog => (
                <DogCard key={dog.id} dog={dog} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
