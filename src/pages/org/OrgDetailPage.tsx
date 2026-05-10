import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Building2, Settings, Users, PawPrint, Globe, Mail, Phone,
  Instagram, Facebook, MapPin, Clock, Search, Plus, ClipboardList,
} from 'lucide-react';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/hooks/useAuth';
import {
  useOrgMembers, useOrgPendingMembers, useOrgActions,
  useEnrolledDogs, useOrgTasks, useOrgDailyReports,
  getOrgById,
} from '@/hooks/useOrg';
import OrgMemberCard from '@/components/org/OrgMemberCard';
import OrgPendingCard from '@/components/org/OrgPendingCard';
import EnrolledDogCard from '@/components/org/EnrolledDogCard';
import OrgTaskCard from '@/components/org/OrgTaskCard';
import OrgTaskForm from '@/components/org/OrgTaskForm';
import DailyReportCard from '@/components/org/DailyReportCard';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type {
  Organization, Dog, UserProfile, OrgTaskStatus, OrgEnrolledDog,
  OrgServiceType, OrgStaffRole, DogMood,
} from '@/types';

const TYPE_LABELS: Record<string, string> = {
  rescue: 'Rescue', shelter: 'Shelter', breeder: 'Breeder',
  training: 'Training', daycare: 'Daycare', spa: 'Spa',
  veterinary: 'Veterinary', boarding: 'Boarding', other: 'Other',
};

const SERVICE_OPTIONS: { value: OrgServiceType; label: string }[] = [
  { value: 'grooming',       label: 'Grooming' },
  { value: 'training',       label: 'Training' },
  { value: 'daycare',        label: 'Daycare' },
  { value: 'boarding',       label: 'Boarding' },
  { value: 'walking',        label: 'Walking' },
  { value: 'rehabilitation', label: 'Rehabilitation' },
  { value: 'vet_care',       label: 'Vet Care' },
  { value: 'spa',            label: 'Spa' },
  { value: 'other',          label: 'Other' },
];

const STAFF_ROLE_OPTIONS: { value: OrgStaffRole; label: string }[] = [
  { value: 'manager',             label: 'Manager' },
  { value: 'groomer',             label: 'Groomer' },
  { value: 'trainer',             label: 'Trainer' },
  { value: 'walker',              label: 'Walker' },
  { value: 'daycare_staff',       label: 'Daycare Staff' },
  { value: 'vet_tech',            label: 'Vet Tech' },
  { value: 'receptionist',        label: 'Receptionist' },
  { value: 'behavior_specialist', label: 'Behavior Specialist' },
  { value: 'other',               label: 'Other' },
];

// ─── Dog enrolment panel ──────────────────────────────────────────────────────

function EnrollDogPanel({
  orgId, onEnrolled,
}: { orgId: string; onEnrolled: () => void }) {
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [ownerResult, setOwnerResult] = useState<UserProfile | null | 'not-found'>(null);
  const [ownerDogs, setOwnerDogs] = useState<Dog[]>([]);
  const [selectedDogId, setSelectedDogId] = useState('');
  const [services, setServices] = useState<OrgServiceType[]>([]);
  const [specialCareNotes, setSpecialCareNotes] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  const { enrollDog } = useEnrolledDogs(orgId);

  const handleSearchOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSearching(true);
    setOwnerResult(null);
    setOwnerDogs([]);
    setSelectedDogId('');

    const snap = await getDocs(query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase())));
    if (snap.empty) { setOwnerResult('not-found'); setSearching(false); return; }

    const owner = { uid: snap.docs[0].id, ...snap.docs[0].data() } as UserProfile;
    setOwnerResult(owner);

    const dogsSnap = await getDocs(query(collection(db, 'dogs'), where('mainHumanId', '==', owner.uid)));
    setOwnerDogs(dogsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Dog)));
    setSearching(false);
  };

  const handleEnroll = async () => {
    if (!selectedDogId || !ownerResult || ownerResult === 'not-found') return;
    const dog = ownerDogs.find(d => d.id === selectedDogId)!;
    setEnrolling(true);
    await enrollDog(
      dog.id, dog.name,
      (ownerResult as UserProfile).uid,
      (ownerResult as UserProfile).displayName,
      (ownerResult as UserProfile).email,
      { dogPhotoURL: dog.photoURL, serviceTypes: services, specialCareNotes: specialCareNotes || undefined }
    );
    setEnrolling(false);
    setEmail(''); setOwnerResult(null); setOwnerDogs([]); setSelectedDogId('');
    setServices([]); setSpecialCareNotes('');
    onEnrolled();
  };

  const toggleService = (s: OrgServiceType) =>
    setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Enroll a Dog</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearchOwner} className="flex gap-2">
          <Input
            placeholder="Owner's email address…"
            value={email}
            onChange={e => { setEmail(e.target.value); setOwnerResult(null); setOwnerDogs([]); }}
            autoComplete="off"
            className="flex-1"
          />
          <Button type="submit" variant="outline" size="icon" disabled={searching} aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {ownerResult === 'not-found' && <p className="text-sm text-muted-foreground">No user found.</p>}

        {ownerResult && ownerResult !== 'not-found' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold shrink-0">
                {ownerResult.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium capitalize truncate">{ownerResult.displayName}</p>
                <p className="text-xs text-muted-foreground">{ownerResult.email}</p>
              </div>
            </div>

            {ownerDogs.length === 0 && <p className="text-sm text-muted-foreground">This user has no dogs.</p>}

            {ownerDogs.length > 0 && (
              <>
                <div className="space-y-1.5">
                  <Label>Select Dog</Label>
                  <Select value={selectedDogId} onValueChange={setSelectedDogId}>
                    <SelectTrigger><SelectValue placeholder="Choose a dog…" /></SelectTrigger>
                    <SelectContent>
                      {ownerDogs.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Services (select all that apply)</Label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_OPTIONS.map(s => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => toggleService(s.value)}
                        className={cn(
                          'text-xs rounded-full px-3 py-1 border transition-colors',
                          services.includes(s.value)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-input hover:bg-muted'
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="care-notes">Special Care Notes</Label>
                  <textarea
                    id="care-notes"
                    value={specialCareNotes}
                    onChange={e => setSpecialCareNotes(e.target.value)}
                    rows={2}
                    placeholder="Allergies, triggers, medications, handling notes…"
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  />
                </div>

                <Button
                  onClick={handleEnroll}
                  disabled={!selectedDogId || enrolling}
                  className="w-full"
                >
                  {enrolling ? 'Enrolling…' : 'Enroll Dog'}
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Dog detail panel ─────────────────────────────────────────────────────────

function DogDetailPanel({
  orgId, enrollment, members, amLeader, onClose,
}: {
  orgId: string;
  enrollment: OrgEnrolledDog;
  members: ReturnType<typeof useOrgMembers>['members'];
  amLeader: boolean;
  onClose: () => void;
}) {
  const { assignStaff, unassignStaff, updateEnrollment, updateTags } = useEnrolledDogs(orgId);
  const { tasks, createTask, updateTaskStatus, deleteTask } = useOrgTasks(orgId, enrollment.dogId);
  const { reports, createReport } = useOrgDailyReports(orgId, enrollment.dogId);
  const { user } = useAuth();

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignRole, setAssignRole] = useState<OrgStaffRole>('groomer');

  // Report form state
  const [reportSummary, setReportSummary] = useState('');
  const [reportMood, setReportMood] = useState<DogMood>('good');
  const [reportActivities, setReportActivities] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    const tags = [...(enrollment.internalTags ?? []), newTag.trim()];
    await updateTags(enrollment.dogId, tags);
    setNewTag('');
  };
  const handleRemoveTag = async (tag: string) => {
    await updateTags(enrollment.dogId, (enrollment.internalTags ?? []).filter(t => t !== tag));
  };

  const handleAssignStaff = async () => {
    if (!assignStaffId) return;
    const m = members.find(x => x.userId === assignStaffId)!;
    await assignStaff(enrollment.dogId, m.userId, m.displayName, assignRole);
    setAssignStaffId('');
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportSummary.trim()) return;
    setSubmittingReport(true);
    await createReport({
      dogId: enrollment.dogId,
      dogName: enrollment.dogName,
      date: new Date().toISOString().slice(0, 10),
      summary: reportSummary.trim(),
      mood: reportMood,
      activities: reportActivities.split(',').map(a => a.trim()).filter(Boolean),
    });
    setReportSummary(''); setReportActivities(''); setShowReportForm(false);
    setSubmittingReport(false);
  };

  const MOODS: { value: DogMood; emoji: string }[] = [
    { value: 'great', emoji: '🌟' }, { value: 'good', emoji: '😊' },
    { value: 'okay', emoji: '😐' }, { value: 'anxious', emoji: '😰' },
    { value: 'tired', emoji: '😴' }, { value: 'sick', emoji: '🤒' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
        <h2 className="text-lg font-bold capitalize">{enrollment.dogName}</h2>
        <span className="text-sm text-muted-foreground">— {enrollment.mainHumanName}</span>
      </div>

      {enrollment.specialCareNotes && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Special Care Notes</p>
          <p className="text-sm text-amber-900">{enrollment.specialCareNotes}</p>
        </div>
      )}

      {/* Internal tags */}
      {amLeader && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm font-medium">Internal Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {(enrollment.internalTags ?? []).map(t => (
                <button
                  key={t}
                  onClick={() => handleRemoveTag(t)}
                  className="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-2 py-0.5 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                >
                  {t} ×
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                placeholder="Add tag (e.g. reactive, anxious)…"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>Add</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff assignments */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <p className="text-sm font-medium">Assigned Staff</p>
          {(enrollment.assignedStaff ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground">No staff assigned yet.</p>
          )}
          {(enrollment.assignedStaff ?? []).map(s => (
            <div key={s.userId} className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                {s.displayName.slice(0, 2).toUpperCase()}
              </div>
              <span className="flex-1 text-sm">{s.displayName}</span>
              <Badge variant="outline" className="text-[10px]">{s.staffRole}</Badge>
              {amLeader && (
                <button
                  onClick={() => unassignStaff(enrollment.dogId, s.userId)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >×</button>
              )}
            </div>
          ))}
          {amLeader && (
            <div className="flex gap-2 mt-2">
              <Select value={assignStaffId} onValueChange={setAssignStaffId}>
                <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue placeholder="Staff member…" /></SelectTrigger>
                <SelectContent>
                  {members.map(m => <SelectItem key={m.userId} value={m.userId}>{m.displayName}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={assignRole} onValueChange={v => setAssignRole(v as OrgStaffRole)}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAFF_ROLE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleAssignStaff} disabled={!assignStaffId} className="h-8">Assign</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks for this dog */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Tasks</p>
          {amLeader && (
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setShowTaskForm(v => !v)}>
              <Plus className="h-3 w-3" />
              Add Task
            </Button>
          )}
        </div>
        {showTaskForm && (
          <Card><CardContent className="pt-4">
            <OrgTaskForm
              enrolledDogs={[enrollment]}
              members={members}
              defaultDogId={enrollment.dogId}
              onSubmit={async data => { await createTask(data); setShowTaskForm(false); }}
              onCancel={() => setShowTaskForm(false)}
            />
          </CardContent></Card>
        )}
        {tasks.length === 0 && !showTaskForm && (
          <p className="text-xs text-muted-foreground">No tasks for this dog yet.</p>
        )}
        {tasks.map(task => (
          <OrgTaskCard
            key={task.id}
            task={task}
            canManage={amLeader}
            isMine={task.assignedTo === user?.uid}
            onStatusChange={updateTaskStatus}
            onDelete={amLeader ? deleteTask : undefined}
          />
        ))}
      </div>

      {/* Daily reports */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Report Cards</p>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setShowReportForm(v => !v)}>
            <Plus className="h-3 w-3" />
            Write Report
          </Button>
        </div>
        {showReportForm && (
          <Card><CardContent className="pt-4">
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Mood</Label>
                <div className="flex gap-2 flex-wrap">
                  {MOODS.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setReportMood(m.value)}
                      className={cn(
                        'text-xl rounded-full p-1.5 border transition-colors',
                        reportMood === m.value ? 'border-primary bg-primary/10' : 'border-input hover:bg-muted'
                      )}
                      title={m.value}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-summary">Summary *</Label>
                <textarea
                  id="report-summary"
                  value={reportSummary}
                  onChange={e => setReportSummary(e.target.value)}
                  rows={3}
                  required
                  placeholder="How did the day go? What did the dog do?"
                  className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-activities">Activities (comma-separated)</Label>
                <Input
                  id="report-activities"
                  value={reportActivities}
                  onChange={e => setReportActivities(e.target.value)}
                  placeholder="e.g. Group play, bath, training, cuddle time"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={!reportSummary.trim() || submittingReport} className="flex-1">
                  {submittingReport ? 'Saving…' : 'Submit Report'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowReportForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent></Card>
        )}
        {reports.length === 0 && !showReportForm && (
          <p className="text-xs text-muted-foreground">No reports yet.</p>
        )}
        {reports.slice(0, 5).map(r => <DailyReportCard key={r.id} report={r} />)}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OrgDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orgs, isOrgLeader } = useOrg();

  const [org, setOrg] = useState<Organization | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<'all' | 'mine' | 'pending' | 'done'>('all');
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [showGlobalTaskForm, setShowGlobalTaskForm] = useState(false);

  const id = orgId ?? '';
  const amLeader = isOrgLeader(id);

  const { members } = useOrgMembers(id);
  const { pending, approveMember, rejectMember } = useOrgPendingMembers(id);
  const { inviteMember, removeMember, promoteToLeader, demoteToStaff } = useOrgActions(id);
  const { enrolled, checkIn, checkOut } = useEnrolledDogs(id);
  const { tasks, createTask, updateTaskStatus, deleteTask } = useOrgTasks(id);

  // Invite member state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<UserProfile | null | 'not-found'>(null);
  const [searching, setSearching] = useState(false);
  const [inviteRole, setInviteRole] = useState<'staff' | 'leader'>('staff');
  const [inviteStaffRole, setInviteStaffRole] = useState<OrgStaffRole>('groomer');
  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const found = orgs.find(o => o.id === id);
    if (found) { setOrg(found); setOrgLoading(false); }
    else getOrgById(id).then(o => { setOrg(o); setOrgLoading(false); });
  }, [id, orgs]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;
    setSearching(true); setSearchResult(null); setInvited(null);
    const snap = await getDocs(query(collection(db, 'users'), where('email', '==', term)));
    if (snap.empty) { setSearchResult('not-found'); setSearching(false); return; }
    const found = { uid: snap.docs[0].id, ...snap.docs[0].data() } as UserProfile;
    setSearchResult(found.uid === user?.uid ? 'not-found' : found);
    setSearching(false);
  };

  const handleInvite = async () => {
    if (!searchResult || searchResult === 'not-found') return;
    setInviting(true);
    await inviteMember(searchResult.uid, searchResult.displayName, searchResult.email, inviteRole, inviteStaffRole);
    setInvited(searchResult.displayName);
    setSearchResult(null); setSearchTerm('');
    setInviting(false);
  };

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'mine') return t.assignedTo === user?.uid;
    if (taskFilter === 'pending') return t.status === 'pending' || t.status === 'in_progress';
    if (taskFilter === 'done') return t.status === 'done';
    return true;
  });

  if (orgLoading) return <div className="text-muted-foreground p-8">Loading…</div>;
  if (!org) return <div className="text-muted-foreground p-8">Organization not found.</div>;

  const initials = org.name.slice(0, 2).toUpperCase();
  const checkedInCount = enrolled.filter(e => e.checkedIn).length;
  const selectedEnrollment = enrolled.find(e => e.dogId === selectedDogId);

  // Dog detail drill-down
  if (selectedEnrollment) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <DogDetailPanel
          orgId={id}
          enrollment={selectedEnrollment}
          members={members}
          amLeader={amLeader}
          onClose={() => setSelectedDogId(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
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
            {amLeader && <Badge className="bg-amber-100 text-amber-800 border-amber-200">Leader</Badge>}
            {org.type && <Badge variant="outline">{TYPE_LABELS[org.type] ?? org.type}</Badge>}
          </div>
          {org.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{org.description}</p>}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {org.staffUserIds.length + org.leaderUserIds.length} members
            </span>
            <span className="flex items-center gap-1">
              <PawPrint className="h-3 w-3" />
              {enrolled.length} dogs
            </span>
            {checkedInCount > 0 && (
              <span className="flex items-center gap-1 text-green-700 font-medium">
                ● {checkedInCount} in facility
              </span>
            )}
          </div>
        </div>
        {amLeader && (
          <Link to={`/orgs/${id}/settings`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5 shrink-0')}>
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Link>
        )}
      </div>

      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster">
            Roster {enrolled.length > 0 ? `(${enrolled.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks {tasks.filter(t => t.status !== 'done').length > 0
              ? `(${tasks.filter(t => t.status !== 'done').length})`
              : ''}
          </TabsTrigger>
          <TabsTrigger value="overview">Info</TabsTrigger>
          <TabsTrigger value="staff">
            Staff {pending.length > 0 && amLeader ? `(${pending.length}★)` : ''}
          </TabsTrigger>
        </TabsList>

        {/* ── Roster tab ── */}
        <TabsContent value="roster" className="space-y-4 mt-4">
          {amLeader && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{checkedInCount} of {enrolled.length} dogs in facility</p>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setShowEnrollForm(v => !v)}>
                <Plus className="h-3 w-3" />
                Enroll Dog
              </Button>
            </div>
          )}

          {showEnrollForm && (
            <EnrollDogPanel orgId={id} onEnrolled={() => setShowEnrollForm(false)} />
          )}

          {enrolled.length === 0 && !showEnrollForm ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed bg-background gap-3">
              <PawPrint className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-sm">No dogs enrolled yet</p>
                {amLeader && <p className="text-sm text-muted-foreground mt-1">Use "Enroll Dog" to add client dogs.</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Checked-in dogs first */}
              {enrolled.filter(e => e.checkedIn).length > 0 && (
                <>
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">In Facility</p>
                  {enrolled.filter(e => e.checkedIn && e.status === 'active').map(e => (
                    <EnrolledDogCard
                      key={e.dogId}
                      enrollment={e}
                      canManage={amLeader}
                      onCheckIn={checkIn}
                      onCheckOut={checkOut}
                      onSelect={setSelectedDogId}
                    />
                  ))}
                </>
              )}
              {enrolled.filter(e => !e.checkedIn && e.status === 'active').length > 0 && (
                <>
                  {enrolled.filter(e => e.checkedIn).length > 0 && (
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Not Checked In</p>
                  )}
                  {enrolled.filter(e => !e.checkedIn && e.status === 'active').map(e => (
                    <EnrolledDogCard
                      key={e.dogId}
                      enrollment={e}
                      canManage={amLeader}
                      onCheckIn={checkIn}
                      onCheckOut={checkOut}
                      onSelect={setSelectedDogId}
                    />
                  ))}
                </>
              )}
              {enrolled.filter(e => e.status !== 'active').length > 0 && (
                <>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Inactive</p>
                  {enrolled.filter(e => e.status !== 'active').map(e => (
                    <EnrolledDogCard
                      key={e.dogId}
                      enrollment={e}
                      canManage={amLeader}
                      onCheckIn={checkIn}
                      onCheckOut={checkOut}
                      onSelect={setSelectedDogId}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Tasks tab ── */}
        <TabsContent value="tasks" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(['all', 'mine', 'pending', 'done'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTaskFilter(f)}
                  className={cn(
                    'text-xs rounded-full px-3 py-1 border transition-colors capitalize',
                    taskFilter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            {amLeader && (
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setShowGlobalTaskForm(v => !v)}>
                <Plus className="h-3 w-3" />
                Add Task
              </Button>
            )}
          </div>

          {showGlobalTaskForm && (
            <Card><CardContent className="pt-4">
              <OrgTaskForm
                enrolledDogs={enrolled}
                members={members}
                onSubmit={async data => { await createTask(data); setShowGlobalTaskForm(false); }}
                onCancel={() => setShowGlobalTaskForm(false)}
              />
            </CardContent></Card>
          )}

          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed bg-background gap-2">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No tasks</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map(task => (
                <OrgTaskCard
                  key={task.id}
                  task={task}
                  canManage={amLeader}
                  isMine={task.assignedTo === user?.uid}
                  onStatusChange={updateTaskStatus}
                  onDelete={amLeader ? deleteTask : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Info / Overview tab ── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {(org.email || org.phone || org.website || org.instagram || org.facebook) && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                {org.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`mailto:${org.email}`} className="hover:underline">{org.email}</a>
                  </div>
                )}
                {org.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`tel:${org.phone}`} className="hover:underline">{org.phone}</a>
                  </div>
                )}
                {org.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
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
                    <p>{[org.address.city, org.address.state, org.address.zip].filter(Boolean).join(', ')}</p>
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

        {/* ── Staff tab ── */}
        <TabsContent value="staff" className="space-y-4 mt-4">
          {/* Invite panel (leaders only) */}
          {amLeader && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm font-medium">Add Staff Member</p>
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
                {invited && <p className="text-sm text-green-600">{invited} has been added.</p>}
                {searchResult === 'not-found' && <p className="text-sm text-muted-foreground">No user found.</p>}
                {searchResult && searchResult !== 'not-found' && (() => {
                  const alreadyIn = members.some(m => m.userId === searchResult.uid);
                  return (
                    <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold shrink-0">
                          {searchResult.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium capitalize truncate">{searchResult.displayName}</p>
                          <p className="text-xs text-muted-foreground">{searchResult.email}</p>
                        </div>
                      </div>
                      {alreadyIn ? (
                        <p className="text-xs text-muted-foreground">Already a member.</p>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Select value={inviteRole} onValueChange={v => setInviteRole(v as 'staff' | 'leader')}>
                              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="leader">Leader</SelectItem>
                              </SelectContent>
                            </Select>
                            {inviteRole === 'staff' && (
                              <Select value={inviteStaffRole} onValueChange={v => setInviteStaffRole(v as OrgStaffRole)}>
                                <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {STAFF_ROLE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <Button size="sm" onClick={handleInvite} disabled={inviting} className="w-full">
                            {inviting ? 'Adding…' : 'Add to Org'}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Pending requests */}
          {amLeader && pending.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-semibold text-amber-700">
                  {pending.length} pending request{pending.length !== 1 ? 's' : ''}
                </p>
              </div>
              {pending.map(p => (
                <OrgPendingCard
                  key={p.userId}
                  pending={p}
                  onApprove={(uid, name, email) => approveMember(uid, name, email, 'staff', 'other')}
                  onReject={rejectMember}
                />
              ))}
            </div>
          )}

          {/* Members list */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Team ({members.length})
            </p>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet.</p>
            ) : (
              members.map(m => (
                <OrgMemberCard
                  key={m.userId}
                  member={m}
                  canManage={amLeader}
                  isCurrentUser={m.userId === user?.uid}
                  onRemove={amLeader ? removeMember : undefined}
                  onPromote={amLeader ? promoteToLeader : undefined}
                  onDemote={amLeader ? demoteToStaff : undefined}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
