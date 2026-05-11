import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Building2, Settings, Users, PawPrint, Globe, Mail, Phone,
  ExternalLink, MapPin, Clock, Search, Plus, ClipboardList,
  AlertTriangle, CheckCircle2, Timer, LogIn, LogOut, Shield,
} from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type {
  Organization, Dog, UserProfile, OrgTaskStatus, OrgEnrolledDog,
  OrgServiceType, OrgStaffRole, OrgTask, DogMood,
} from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  rescue: 'Rescue', shelter: 'Shelter', breeder: 'Breeder',
  training: 'Training', daycare: 'Daycare', spa: 'Spa',
  veterinary: 'Veterinary', boarding: 'Boarding', other: 'Other',
};

const SERVICE_OPTIONS: { value: OrgServiceType; label: string }[] = [
  { value: 'grooming', label: 'Grooming' }, { value: 'training', label: 'Training' },
  { value: 'daycare', label: 'Daycare' },   { value: 'boarding', label: 'Boarding' },
  { value: 'walking', label: 'Walking' },   { value: 'rehabilitation', label: 'Rehab' },
  { value: 'vet_care', label: 'Vet Care' }, { value: 'spa', label: 'Spa' },
  { value: 'other', label: 'Other' },
];

const STAFF_ROLE_OPTIONS: { value: OrgStaffRole; label: string }[] = [
  { value: 'manager', label: 'Manager' }, { value: 'groomer', label: 'Groomer' },
  { value: 'trainer', label: 'Trainer' }, { value: 'walker', label: 'Walker' },
  { value: 'daycare_staff', label: 'Daycare Staff' }, { value: 'vet_tech', label: 'Vet Tech' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'behavior_specialist', label: 'Behavior Specialist' }, { value: 'other', label: 'Other' },
];

const TASK_STATUS_COLOR: Record<OrgTaskStatus, string> = {
  pending: '#94a3b8', in_progress: '#3b82f6', done: '#22c55e', cancelled: '#d1d5db',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(sinceMs: number): string {
  const totalMin = Math.floor((Date.now() - sinceMs) / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtDueAt(ms: number): string {
  const d = new Date(ms);
  if (isToday(d))    return `Today ${format(d, 'h:mm a')}`;
  if (isTomorrow(d)) return `Tomorrow ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d · h:mm a');
}

function Avatar({ name, photoURL, size = 'md' }: { name: string; photoURL?: string; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  if (photoURL) return <img src={photoURL} alt={name} className={cn(cls, 'rounded-xl object-cover shrink-0')} />;
  return (
    <div className={cn(cls, 'rounded-xl bg-amber-100 flex items-center justify-center font-semibold text-amber-800 shrink-0')}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  icon: Icon, label, value, sub, urgent,
}: { icon: React.ElementType; label: string; value: number | string; sub?: string; urgent?: boolean }) {
  return (
    <div className={cn(
      'rounded-2xl border px-4 py-3 flex flex-col gap-1',
      urgent && value ? 'border-red-200 bg-red-50/50' : 'bg-card',
    )}>
      <div className="flex items-center gap-1.5">
        <Icon className={cn('h-3.5 w-3.5', urgent && value ? 'text-red-500' : 'text-muted-foreground')} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn('text-2xl font-bold tabular-nums leading-none', urgent && value ? 'text-red-600' : 'text-foreground')}
        style={{ fontFamily: 'var(--font-heading)' }}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Floor dog row ────────────────────────────────────────────────────────────

function FloorDogRow({
  enrollment, tasks, canManage, onSelect, onCheckOut,
}: {
  enrollment: OrgEnrolledDog;
  tasks: OrgTask[];
  canManage: boolean;
  onSelect: (id: string) => void;
  onCheckOut: (id: string) => void;
}) {
  const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
  const overdueTasks = activeTasks.filter(t => t.dueAt && t.dueAt < Date.now());

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => onSelect(enrollment.dogId)}
    >
      <Avatar name={enrollment.dogName} photoURL={enrollment.dogPhotoURL} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold capitalize truncate">{enrollment.dogName}</p>
          {enrollment.specialCareNotes && (
            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
          )}
          {overdueTasks.length > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">
              {overdueTasks.length} overdue
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{enrollment.mainHumanName}</p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {enrollment.serviceTypes.slice(0, 3).map(s => (
            <span key={s} className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
              {s.replace('_', ' ')}
            </span>
          ))}
          {enrollment.checkedInAt && (
            <span className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5">
              <Timer className="h-2.5 w-2.5" />{fmtDuration(enrollment.checkedInAt)}
            </span>
          )}
        </div>
      </div>

      {/* Task status dots */}
      {tasks.length > 0 && (
        <div className="flex flex-col gap-1 shrink-0">
          <div className="flex gap-0.5 flex-wrap justify-end max-w-[40px]">
            {tasks.slice(0, 6).map(t => (
              <div
                key={t.id}
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: TASK_STATUS_COLOR[t.status] }}
                title={`${t.title}: ${t.status}`}
              />
            ))}
          </div>
          {tasks.length > 6 && <span className="text-[9px] text-muted-foreground text-right">+{tasks.length - 6}</span>}
        </div>
      )}

      {canManage && (
        <button
          onClick={e => { e.stopPropagation(); onCheckOut(enrollment.dogId); }}
          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-muted-foreground border border-border/60 hover:border-border hover:text-foreground transition-colors"
        >
          <LogOut className="h-3 w-3" /> Out
        </button>
      )}
    </div>
  );
}

// ─── Enroll dog panel ─────────────────────────────────────────────────────────

function EnrollDogPanel({ orgId, onEnrolled }: { orgId: string; onEnrolled: () => void }) {
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
    setSearching(true); setOwnerResult(null); setOwnerDogs([]); setSelectedDogId('');
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
    await enrollDog(dog.id, dog.name, (ownerResult as UserProfile).uid,
      (ownerResult as UserProfile).displayName, (ownerResult as UserProfile).email,
      { dogPhotoURL: dog.photoURL, serviceTypes: services, specialCareNotes: specialCareNotes || undefined });
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
          <Input placeholder="Owner's email address…" value={email}
            onChange={e => { setEmail(e.target.value); setOwnerResult(null); setOwnerDogs([]); }}
            autoComplete="off" className="flex-1" />
          <Button type="submit" variant="outline" size="icon" disabled={searching}><Search className="h-4 w-4" /></Button>
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
                    <SelectContent>{ownerDogs.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Services</Label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_OPTIONS.map(s => (
                      <button key={s.value} type="button" onClick={() => toggleService(s.value)}
                        className={cn('text-xs rounded-full px-3 py-1 border transition-colors',
                          services.includes(s.value) ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted')}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="care-notes">Special Care Notes</Label>
                  <textarea id="care-notes" value={specialCareNotes} onChange={e => setSpecialCareNotes(e.target.value)} rows={2}
                    placeholder="Allergies, triggers, medications, handling notes…"
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
                </div>
                <Button onClick={handleEnroll} disabled={!selectedDogId || enrolling} className="w-full">
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
  orgId: string; enrollment: OrgEnrolledDog;
  members: ReturnType<typeof useOrgMembers>['members'];
  amLeader: boolean; onClose: () => void;
}) {
  const { assignStaff, unassignStaff, updateTags } = useEnrolledDogs(orgId);
  const { tasks, createTask, updateTaskStatus, deleteTask } = useOrgTasks(orgId, enrollment.dogId);
  const { reports, createReport } = useOrgDailyReports(orgId, enrollment.dogId);
  const { user } = useAuth();

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignRole, setAssignRole] = useState<OrgStaffRole>('groomer');
  const [reportSummary, setReportSummary] = useState('');
  const [reportMood, setReportMood] = useState<DogMood>('good');
  const [reportActivities, setReportActivities] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const MOODS: { value: DogMood; emoji: string }[] = [
    { value: 'great', emoji: '🌟' }, { value: 'good', emoji: '😊' }, { value: 'okay', emoji: '😐' },
    { value: 'anxious', emoji: '😰' }, { value: 'tired', emoji: '😴' }, { value: 'sick', emoji: '🤒' },
  ];

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportSummary.trim()) return;
    setSubmittingReport(true);
    await createReport({
      dogId: enrollment.dogId, dogName: enrollment.dogName,
      date: new Date().toISOString().slice(0, 10),
      summary: reportSummary.trim(), mood: reportMood,
      activities: reportActivities.split(',').map(a => a.trim()).filter(Boolean),
    });
    setReportSummary(''); setReportActivities(''); setShowReportForm(false); setSubmittingReport(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
        <h2 className="text-lg font-bold capitalize">{enrollment.dogName}</h2>
        <span className="text-sm text-muted-foreground">— {enrollment.mainHumanName}</span>
      </div>

      {enrollment.specialCareNotes && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">⚠️ Special Care Notes</p>
          <p className="text-sm text-amber-900">{enrollment.specialCareNotes}</p>
        </div>
      )}

      {amLeader && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm font-medium">Internal Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {(enrollment.internalTags ?? []).map(t => (
                <button key={t} onClick={() => updateTags(enrollment.dogId, (enrollment.internalTags ?? []).filter(x => x !== t))}
                  className="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-2 py-0.5 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
                  {t} ×
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newTag} onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newTag.trim()) { updateTags(enrollment.dogId, [...(enrollment.internalTags ?? []), newTag.trim()]); setNewTag(''); } } }}
                placeholder="Add tag…" className="flex-1" />
              <Button type="button" variant="outline" size="sm"
                onClick={() => { if (newTag.trim()) { updateTags(enrollment.dogId, [...(enrollment.internalTags ?? []), newTag.trim()]); setNewTag(''); } }}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4 space-y-3">
          <p className="text-sm font-medium">Assigned Staff</p>
          {(enrollment.assignedStaff ?? []).length === 0 && <p className="text-xs text-muted-foreground">No staff assigned.</p>}
          {(enrollment.assignedStaff ?? []).map(s => (
            <div key={s.userId} className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                {s.displayName.slice(0, 2).toUpperCase()}
              </div>
              <span className="flex-1 text-sm">{s.displayName}</span>
              <Badge variant="outline" className="text-[10px]">{s.staffRole}</Badge>
              {amLeader && <button onClick={() => unassignStaff(enrollment.dogId, s.userId)} className="text-xs text-muted-foreground hover:text-destructive">×</button>}
            </div>
          ))}
          {amLeader && (
            <div className="flex gap-2 mt-2">
              <Select value={assignStaffId} onValueChange={setAssignStaffId}>
                <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue placeholder="Staff member…" /></SelectTrigger>
                <SelectContent>{members.map(m => <SelectItem key={m.userId} value={m.userId}>{m.displayName}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={assignRole} onValueChange={v => setAssignRole(v as OrgStaffRole)}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{STAFF_ROLE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-8"
                onClick={() => { const m = members.find(x => x.userId === assignStaffId); if (m) { assignStaff(enrollment.dogId, m.userId, m.displayName, assignRole); setAssignStaffId(''); } }}
                disabled={!assignStaffId}>
                Assign
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Tasks</p>
          {amLeader && (
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setShowTaskForm(v => !v)}>
              <Plus className="h-3 w-3" /> Add Task
            </Button>
          )}
        </div>
        {showTaskForm && (
          <Card><CardContent className="pt-4">
            <OrgTaskForm enrolledDogs={[enrollment]} members={members} defaultDogId={enrollment.dogId}
              onSubmit={async data => { await createTask(data); setShowTaskForm(false); }}
              onCancel={() => setShowTaskForm(false)} />
          </CardContent></Card>
        )}
        {tasks.length === 0 && !showTaskForm && <p className="text-xs text-muted-foreground">No tasks yet.</p>}
        {tasks.map(task => (
          <OrgTaskCard key={task.id} task={task} canManage={amLeader} isMine={task.assignedTo === user?.uid}
            onStatusChange={updateTaskStatus} onDelete={amLeader ? deleteTask : undefined} />
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Report Cards</p>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setShowReportForm(v => !v)}>
            <Plus className="h-3 w-3" /> Write Report
          </Button>
        </div>
        {showReportForm && (
          <Card><CardContent className="pt-4">
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Mood</Label>
                <div className="flex gap-2 flex-wrap">
                  {MOODS.map(m => (
                    <button key={m.value} type="button" onClick={() => setReportMood(m.value)}
                      className={cn('text-xl rounded-full p-1.5 border transition-colors', reportMood === m.value ? 'border-primary bg-primary/10' : 'border-input hover:bg-muted')}
                      title={m.value}>{m.emoji}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-summary">Summary *</Label>
                <textarea id="report-summary" value={reportSummary} onChange={e => setReportSummary(e.target.value)} rows={3} required
                  placeholder="How did the day go?"
                  className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-activities">Activities (comma-separated)</Label>
                <Input id="report-activities" value={reportActivities} onChange={e => setReportActivities(e.target.value)} placeholder="e.g. Group play, bath, training" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={!reportSummary.trim() || submittingReport} className="flex-1">
                  {submittingReport ? 'Saving…' : 'Submit'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowReportForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent></Card>
        )}
        {reports.length === 0 && !showReportForm && <p className="text-xs text-muted-foreground">No reports yet.</p>}
        {reports.slice(0, 5).map(r => <DailyReportCard key={r.id} report={r} />)}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OrgDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const { user } = useAuth();
  const { orgs, isOrgLeader } = useOrg();

  const [org, setOrg] = useState<Organization | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [showGlobalTaskForm, setShowGlobalTaskForm] = useState(false);
  const [dogSearch, setDogSearch] = useState('');
  const [dogFilter, setDogFilter] = useState<'all' | 'in' | 'out' | 'inactive'>('all');
  const [taskView, setTaskView] = useState<'mine' | 'all'>('all');
  const [taskStatus, setTaskStatus] = useState<'active' | 'done'>('active');

  // Staff search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<UserProfile | null | 'not-found'>(null);
  const [searching, setSearching] = useState(false);
  const [inviteRole, setInviteRole] = useState<'staff' | 'leader'>('staff');
  const [inviteStaffRole, setInviteStaffRole] = useState<OrgStaffRole>('groomer');
  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState<string | null>(null);

  const id = orgId ?? '';
  const amLeader = isOrgLeader(id);

  const { members } = useOrgMembers(id);
  const { pending, approveMember, rejectMember } = useOrgPendingMembers(id);
  const { inviteMember, removeMember, promoteToLeader, demoteToStaff } = useOrgActions(id);
  const { enrolled, checkIn, checkOut } = useEnrolledDogs(id);
  const { tasks, createTask, updateTaskStatus, deleteTask } = useOrgTasks(id);

  useEffect(() => {
    if (!id) return;
    const found = orgs.find(o => o.id === id);
    if (found) { setOrg(found); setOrgLoading(false); }
    else getOrgById(id).then(o => { setOrg(o); setOrgLoading(false); });
  }, [id, orgs]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const tasksByDogId = useMemo(() => {
    const map = new Map<string, OrgTask[]>();
    tasks.forEach(t => {
      if (!map.has(t.dogId)) map.set(t.dogId, []);
      map.get(t.dogId)!.push(t);
    });
    return map;
  }, [tasks]);

  const checkedInDogs   = useMemo(() => enrolled.filter(e => e.checkedIn && e.status === 'active'), [enrolled]);
  const activeTasks     = useMemo(() => tasks.filter(t => t.status === 'pending' || t.status === 'in_progress'), [tasks]);
  const overdueTasks    = useMemo(() => activeTasks.filter(t => t.dueAt && t.dueAt < Date.now()), [activeTasks]);
  const doneTodayTasks  = useMemo(() => tasks.filter(t => t.status === 'done' && t.completedAt && isToday(new Date(t.completedAt))), [tasks]);
  const specialCareAlerts = useMemo(() => checkedInDogs.filter(d => d.specialCareNotes), [checkedInDogs]);

  const myActiveTasks = useMemo(() => activeTasks.filter(t => t.assignedTo === user?.uid), [activeTasks, user]);

  const filteredDogs = useMemo(() => {
    let list = enrolled;
    if (dogFilter === 'in')       list = enrolled.filter(e => e.checkedIn && e.status === 'active');
    if (dogFilter === 'out')      list = enrolled.filter(e => !e.checkedIn && e.status === 'active');
    if (dogFilter === 'inactive') list = enrolled.filter(e => e.status !== 'active');
    if (dogSearch.trim()) {
      const q = dogSearch.toLowerCase();
      list = list.filter(e => e.dogName.toLowerCase().includes(q) || e.mainHumanName.toLowerCase().includes(q));
    }
    return list;
  }, [enrolled, dogFilter, dogSearch]);

  const displayedTasks = useMemo(() => {
    let list = taskView === 'mine' ? tasks.filter(t => t.assignedTo === user?.uid) : tasks;
    list = taskStatus === 'done' ? list.filter(t => t.status === 'done') : list.filter(t => t.status !== 'done' && t.status !== 'cancelled');
    return [...list].sort((a, b) => {
      // Overdue first, then by dueAt, then newest
      const aOver = a.dueAt && a.dueAt < Date.now() ? 0 : 1;
      const bOver = b.dueAt && b.dueAt < Date.now() ? 0 : 1;
      if (aOver !== bOver) return aOver - bOver;
      return (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity);
    });
  }, [tasks, taskView, taskStatus, user]);

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

  if (orgLoading) return <div className="text-muted-foreground p-8">Loading…</div>;
  if (!org) return <div className="text-muted-foreground p-8">Organization not found.</div>;

  const selectedEnrollment = enrolled.find(e => e.dogId === selectedDogId);
  if (selectedEnrollment) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <DogDetailPanel orgId={id} enrollment={selectedEnrollment} members={members} amLeader={amLeader} onClose={() => setSelectedDogId(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        {org.logoURL
          ? <img src={org.logoURL} alt={org.name} className="h-14 w-14 rounded-2xl object-cover shrink-0" />
          : <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center text-xl font-bold text-amber-800 shrink-0">
              {org.name.slice(0, 2).toUpperCase()}
            </div>
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight">{org.name}</h1>
            {amLeader && <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]"><Shield className="h-2.5 w-2.5 mr-0.5" />Leader</Badge>}
            {org.type && <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[org.type] ?? org.type}</Badge>}
          </div>
          {org.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{org.description}</p>}
        </div>
        {amLeader && (
          <Link to={`/orgs/${id}/settings`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5 shrink-0')}>
            <Settings className="h-3.5 w-3.5" /> Settings
          </Link>
        )}
      </div>

      <Tabs defaultValue="today">
        <TabsList className="w-full">
          <TabsTrigger value="today" className="flex-1">Today</TabsTrigger>
          <TabsTrigger value="dogs" className="flex-1">
            Dogs {enrolled.filter(e => e.status === 'active').length > 0 ? `(${enrolled.filter(e => e.status === 'active').length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex-1">
            Tasks {activeTasks.length > 0 ? `(${activeTasks.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex-1">
            Staff {pending.length > 0 && amLeader ? `(${pending.length}!)` : `(${members.length})`}
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════ TODAY TAB ══════════════════════════════════ */}
        <TabsContent value="today" className="space-y-4 mt-4">

          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3">
            <StatTile icon={PawPrint}      label="In Facility"  value={checkedInDogs.length} sub={`of ${enrolled.filter(e => e.status === 'active').length} enrolled`} />
            <StatTile icon={AlertTriangle} label="Overdue"      value={overdueTasks.length}   urgent />
            <StatTile icon={ClipboardList} label="Active Tasks" value={activeTasks.length}    sub={`${myActiveTasks.length} assigned to me`} />
            <StatTile icon={CheckCircle2}  label="Done Today"   value={doneTodayTasks.length} />
          </div>

          {/* Alerts */}
          {(overdueTasks.length > 0 || specialCareAlerts.length > 0) && (
            <div className="rounded-xl border border-red-200 bg-red-50/60 divide-y divide-red-100 overflow-hidden">
              <div className="px-3 py-2 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs font-semibold text-red-700">Needs attention</span>
              </div>
              {overdueTasks.slice(0, 4).map(t => (
                <div key={t.id} className="px-3 py-2 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                  <p className="text-xs flex-1 truncate">
                    <span className="font-medium">{t.dogName}</span>
                    <span className="text-muted-foreground"> · {t.title}</span>
                    {t.dueAt && <span className="text-red-600"> · {fmtDueAt(t.dueAt)}</span>}
                  </p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{t.assignedToName}</span>
                </div>
              ))}
              {specialCareAlerts.slice(0, 3).map(d => (
                <div key={d.dogId} className="px-3 py-2 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                  <p className="text-xs flex-1 truncate">
                    <span className="font-medium">{d.dogName}</span>
                    <span className="text-muted-foreground"> · {d.specialCareNotes}</span>
                  </p>
                  <Badge variant="outline" className="text-[9px] border-amber-200 text-amber-700 shrink-0">in facility</Badge>
                </div>
              ))}
            </div>
          )}

          {/* Live floor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                Live floor
                <span className="text-muted-foreground font-normal">({checkedInDogs.length})</span>
              </h3>
              {amLeader && (
                <button onClick={() => setShowEnrollForm(v => !v)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                  <Plus className="h-3 w-3" /> Enroll dog
                </button>
              )}
            </div>
            {showEnrollForm && <EnrollDogPanel orgId={id} onEnrolled={() => setShowEnrollForm(false)} />}
            {checkedInDogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed gap-2 text-muted-foreground">
                <PawPrint className="h-6 w-6" />
                <p className="text-sm">No dogs checked in right now</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {checkedInDogs.map(e => (
                  <FloorDogRow key={e.dogId} enrollment={e} tasks={tasksByDogId.get(e.dogId) ?? []}
                    canManage={amLeader} onSelect={setSelectedDogId} onCheckOut={checkOut} />
                ))}
              </div>
            )}
          </div>

          {/* Active tasks (top 6, sorted by urgency) */}
          {activeTasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Active tasks</h3>
                {amLeader && (
                  <button onClick={() => setShowGlobalTaskForm(v => !v)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                    <Plus className="h-3 w-3" /> Add
                  </button>
                )}
              </div>
              {showGlobalTaskForm && (
                <Card><CardContent className="pt-4">
                  <OrgTaskForm enrolledDogs={enrolled} members={members}
                    onSubmit={async data => { await createTask(data); setShowGlobalTaskForm(false); }}
                    onCancel={() => setShowGlobalTaskForm(false)} />
                </CardContent></Card>
              )}
              <div className="space-y-2">
                {[...activeTasks]
                  .sort((a, b) => {
                    const aOver = a.dueAt && a.dueAt < Date.now() ? 0 : 1;
                    const bOver = b.dueAt && b.dueAt < Date.now() ? 0 : 1;
                    if (aOver !== bOver) return aOver - bOver;
                    return (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity);
                  })
                  .slice(0, 6)
                  .map(task => (
                    <OrgTaskCard key={task.id} task={task} canManage={amLeader} isMine={task.assignedTo === user?.uid}
                      onStatusChange={updateTaskStatus} onDelete={amLeader ? deleteTask : undefined} />
                  ))}
              </div>
              {activeTasks.length > 6 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{activeTasks.length - 6} more — see Tasks tab
                </p>
              )}
            </div>
          )}
        </TabsContent>

        {/* ══════════════════════════════════ DOGS TAB ══════════════════════════════════ */}
        <TabsContent value="dogs" className="space-y-3 mt-4">
          {/* Search + filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={dogSearch} onChange={e => setDogSearch(e.target.value)}
                placeholder="Search dogs or owners…" className="pl-9 h-9" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'in', 'out', 'inactive'] as const).map(f => (
                <button key={f} onClick={() => setDogFilter(f)}
                  className={cn('text-xs rounded-full px-3 py-1 border transition-colors capitalize',
                    dogFilter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted')}>
                  {f === 'in' ? '✓ Checked in' : f === 'out' ? 'Not here' : f}
                </button>
              ))}
            </div>
          </div>

          {amLeader && (
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setShowEnrollForm(v => !v)}>
                <Plus className="h-3 w-3" /> Enroll Dog
              </Button>
            </div>
          )}
          {showEnrollForm && <EnrollDogPanel orgId={id} onEnrolled={() => setShowEnrollForm(false)} />}

          {filteredDogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed gap-2">
              <PawPrint className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{dogSearch ? 'No dogs match your search' : 'No dogs enrolled yet'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDogs.map(e => (
                <EnrolledDogCard key={e.dogId} enrollment={e} canManage={amLeader}
                  onCheckIn={checkIn} onCheckOut={checkOut} onSelect={setSelectedDogId} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ══════════════════════════════════ TASKS TAB ══════════════════════════════════ */}
        <TabsContent value="tasks" className="space-y-3 mt-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              {(['all', 'mine'] as const).map(v => (
                <button key={v} onClick={() => setTaskView(v)}
                  className={cn('text-xs rounded-full px-3 py-1 border transition-colors capitalize',
                    taskView === v ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted')}>
                  {v === 'mine' ? 'My tasks' : 'All tasks'}
                </button>
              ))}
              <span className="text-border/60">|</span>
              {(['active', 'done'] as const).map(v => (
                <button key={v} onClick={() => setTaskStatus(v)}
                  className={cn('text-xs rounded-full px-3 py-1 border transition-colors capitalize',
                    taskStatus === v ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted')}>
                  {v}
                </button>
              ))}
            </div>
            {amLeader && (
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs shrink-0" onClick={() => setShowGlobalTaskForm(v => !v)}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            )}
          </div>

          {showGlobalTaskForm && (
            <Card><CardContent className="pt-4">
              <OrgTaskForm enrolledDogs={enrolled} members={members}
                onSubmit={async data => { await createTask(data); setShowGlobalTaskForm(false); }}
                onCancel={() => setShowGlobalTaskForm(false)} />
            </CardContent></Card>
          )}

          {displayedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed gap-2">
              <ClipboardList className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No tasks</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedTasks.map(task => (
                <OrgTaskCard key={task.id} task={task} canManage={amLeader} isMine={task.assignedTo === user?.uid}
                  onStatusChange={updateTaskStatus} onDelete={amLeader ? deleteTask : undefined} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ══════════════════════════════════ STAFF TAB ══════════════════════════════════ */}
        <TabsContent value="staff" className="space-y-4 mt-4">
          {/* Pending join requests */}
          {amLeader && pending.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden">
              <div className="px-4 py-2.5 flex items-center gap-2 border-b border-amber-200">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">{pending.length} pending request{pending.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-amber-100">
                {pending.map(p => (
                  <OrgPendingCard key={p.userId} pending={p}
                    onApprove={(uid, name, email) => approveMember(uid, name, email, 'staff', 'other')}
                    onReject={rejectMember} />
                ))}
              </div>
            </div>
          )}

          {/* Add staff */}
          {amLeader && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm font-medium">Add Staff Member</p>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input placeholder="Email address…" value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setSearchResult(null); setInvited(null); }}
                    autoComplete="off" className="flex-1" />
                  <Button type="submit" variant="outline" size="icon" disabled={searching}><Search className="h-4 w-4" /></Button>
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
                      {alreadyIn ? <p className="text-xs text-muted-foreground">Already a member.</p> : (
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
                                <SelectContent>{STAFF_ROLE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
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

          {/* Org info quick-view */}
          {(org.email || org.phone || org.website || (org.address?.city)) && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                {org.email    && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground shrink-0" /><a href={`mailto:${org.email}`} className="hover:underline">{org.email}</a></div>}
                {org.phone    && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground shrink-0" /><a href={`tel:${org.phone}`} className="hover:underline">{org.phone}</a></div>}
                {org.website  && <div className="flex items-center gap-2 text-sm"><Globe className="h-4 w-4 text-muted-foreground shrink-0" /><a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{org.website.replace(/^https?:\/\//, '')}</a></div>}
                {org.address?.city && (
                  <div className="flex items-start gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{[org.address.street, org.address.city, org.address.state, org.address.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {(org.instagram || org.facebook) && (
                  <div className="flex gap-3">
                    {org.instagram && <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><ExternalLink className="h-3.5 w-3.5" />{org.instagram}</div>}
                    {org.facebook  && <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><ExternalLink className="h-3.5 w-3.5" />{org.facebook}</div>}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Team list */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Team ({members.length})</p>
            {members.length === 0
              ? <p className="text-sm text-muted-foreground">No members yet.</p>
              : members.map(m => (
                  <OrgMemberCard key={m.userId} member={m} canManage={amLeader} isCurrentUser={m.userId === user?.uid}
                    onRemove={amLeader ? removeMember : undefined}
                    onPromote={amLeader ? promoteToLeader : undefined}
                    onDemote={amLeader ? demoteToStaff : undefined} />
                ))
            }
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
