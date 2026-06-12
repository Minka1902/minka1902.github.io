import { useState } from 'react';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBusiness, useClasses, useCustomers, useEnrollments } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import { addDays, todayStr } from '@/lib/occupancy';
import { classSpotsLeft, type ClassSession, type GroupClass } from '@/types';

function ClassRoster({ bid, cls, canManage }: { bid: string; cls: GroupClass; canManage: boolean }) {
  const { customers } = useCustomers(bid);
  const { enrollments, enrollCustomer, setEnrollmentStatus, setAttendance, deleteEnrollment } = useEnrollments(bid, cls.id);
  const [customerId, setCustomerId] = useState('');
  const [petName, setPetName] = useState('');

  const active = enrollments.filter(e => e.status !== 'cancelled');
  const spotsLeft = classSpotsLeft(cls, enrollments);

  const addEnrollment = async () => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || !petName.trim()) return;
    await enrollCustomer(cls, {
      customerId, customerName: customer.name, customerUserId: customer.linkedUserId, petName: petName.trim(),
    });
    setPetName('');
  };

  return (
    <div className="space-y-2 border-t pt-2">
      {active.length === 0 && <p className="text-xs text-muted-foreground">No enrollments yet.</p>}
      {active.map(e => (
        <div key={e.id} className="space-y-1 rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">
              {e.petName} <span className="font-normal text-muted-foreground">({e.customerName})</span>
              {e.status === 'waitlisted' && <Badge variant="outline" className="ml-2">Waitlist</Badge>}
            </p>
            {canManage && (
              <div className="flex gap-1">
                {e.status === 'waitlisted' && spotsLeft > 0 && (
                  <Button size="sm" variant="outline" onClick={() => void setEnrollmentStatus(e.id, 'enrolled')}>Promote</Button>
                )}
                <Button variant="ghost" size="icon-sm" onClick={() => void deleteEnrollment(e.id)} aria-label="Remove enrollment">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
          {canManage && e.status === 'enrolled' && cls.sessions.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              {cls.sessions.map(s => (
                <label key={s.date} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={e.attendance?.[s.date] ?? false}
                    onChange={ev => void setAttendance(e, s.date, ev.target.checked)}
                  />
                  {s.date.slice(5)}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
      {canManage && cls.status === 'open' && (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={customerId} onValueChange={v => setCustomerId(v ?? '')}>
            <SelectTrigger size="sm" className="w-40"><SelectValue placeholder="Customer" /></SelectTrigger>
            <SelectContent>
              {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input className="h-7 w-32 text-sm" value={petName} onChange={e => setPetName(e.target.value)} placeholder="Pet name" aria-label="Pet name" />
          <Button size="sm" variant="outline" onClick={addEnrollment} disabled={!customerId || !petName.trim()}>
            Enroll
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ClassesPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const currency = activeBusiness?.currency ?? 'USD';
  const { classes, loading, createClass, updateClass, deleteClass } = useClasses(bid);
  const { enrollments } = useEnrollments(bid);

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('8');
  const [price, setPrice] = useState('');
  const [sessions, setSessions] = useState<ClassSession[]>([{ date: addDays(todayStr(), 7), start: '18:00', end: '19:00' }]);

  const canView = can('view_classes');
  const canManage = can('manage_classes');

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canView && !canManage) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to classes.</div>;
  }

  const setSession = (i: number, patch: Partial<ClassSession>) =>
    setSessions(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));

  const submit = async () => {
    if (!name.trim() || Number(capacity) < 1 || sessions.length === 0) return;
    await createClass({
      name: name.trim(),
      capacity: Math.floor(Number(capacity)),
      price: price !== '' ? Number(price) : undefined,
      sessions: [...sessions].sort((a, b) => a.date.localeCompare(b.date)),
      status: 'open',
    });
    setAddOpen(false);
    setName('');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Group classes</h1>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New class
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <GraduationCap className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No classes</p>
            <p className="mt-1 text-sm text-muted-foreground">Schedule a class — customers enroll from the directory.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map(cls => {
            const clsEnrollments = enrollments.filter(e => e.classId === cls.id);
            const spotsLeft = classSpotsLeft(cls, clsEnrollments);
            return (
              <Card key={cls.id}>
                <CardContent className="space-y-2 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span>{cls.name}</span>
                        <Badge variant={cls.status === 'open' ? 'secondary' : 'outline'}>{cls.status}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {spotsLeft}/{cls.capacity} spots free
                        {cls.price != null ? ` · ${cls.price.toFixed(2)} ${currency}` : ''}
                        {' · '}{cls.sessions.map(s => `${s.date.slice(5)} ${s.start}`).join(', ')}
                      </p>
                    </div>
                    {canManage && (
                      <div className="flex shrink-0 gap-1">
                        {cls.status === 'open' && (
                          <Button size="sm" variant="outline" onClick={() => void updateClass(cls.id, { status: 'completed' })}>
                            Complete
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm(`Delete ${cls.name}?`)) void deleteClass(cls.id); }} aria-label={`Delete ${cls.name}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <ClassRoster bid={bid} cls={cls} canManage={canManage} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New class</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cls-name">Name <span className="text-destructive">*</span></Label>
              <Input id="cls-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Puppy basics" required />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cls-capacity">Capacity</Label>
                <Input id="cls-capacity" type="number" min="1" step="1" value={capacity} onChange={e => setCapacity(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cls-price">Price ({currency})</Label>
                <Input id="cls-price" type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sessions</Label>
              {sessions.map((s, i) => (
                <div key={i} className="grid grid-cols-12 items-center gap-2">
                  <Input className="col-span-5" type="date" value={s.date} onChange={e => setSession(i, { date: e.target.value })} aria-label={`Session ${i + 1} date`} />
                  <Input className="col-span-3" type="time" value={s.start} onChange={e => setSession(i, { start: e.target.value })} aria-label={`Session ${i + 1} start`} />
                  <Input className="col-span-3" type="time" value={s.end} onChange={e => setSession(i, { end: e.target.value })} aria-label={`Session ${i + 1} end`} />
                  <button type="button" onClick={() => setSessions(prev => prev.filter((_, idx) => idx !== i))} className="col-span-1 flex justify-center text-muted-foreground hover:text-destructive" aria-label="Remove session">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSessions(prev => [...prev, { date: addDays(prev[prev.length - 1]?.date ?? todayStr(), 7), start: '18:00', end: '19:00' }])}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4" /> Add session
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={!name.trim() || sessions.length === 0}>Create class</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
