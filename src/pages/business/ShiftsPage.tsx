import { useState } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBusiness, useBusinessStaff, useShifts, useTimeOff } from '@/hooks/useBusiness';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { addDays, todayStr } from '@/lib/occupancy';
import { isOnTimeOff } from '@/lib/shifts';
import { WEEKDAY_LABELS } from '@/types';

// Monday of the week containing `date` ('YYYY-MM-DD' string math).
function weekStart(date: string): string {
  const dow = new Date(`${date}T00:00:00`).getDay(); // 0 = Sunday
  return addDays(date, -((dow + 6) % 7));
}

export default function ShiftsPage() {
  const { activeBusiness } = useBusiness();
  const { user } = useAuth();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const { shifts, loading, createShift, deleteShift } = useShifts(bid);
  const { staff } = useBusinessStaff(bid);
  const { requests, requestTimeOff, decideTimeOff, deleteTimeOff } = useTimeOff(bid);

  const [week, setWeek] = useState(weekStart(todayStr()));
  const [addOpen, setAddOpen] = useState(false);
  const [shiftStaffId, setShiftStaffId] = useState('');
  const [shiftDate, setShiftDate] = useState(todayStr());
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('17:00');
  const [offStart, setOffStart] = useState(todayStr());
  const [offEnd, setOffEnd] = useState(todayStr());
  const [offReason, setOffReason] = useState('');

  const canManage = can('manage_shifts');

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  // Every member may see the rota (own shifts are always readable by rules).

  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const activeStaff = staff.filter(s => s.active);
  const pendingRequests = requests.filter(r => r.status === 'requested');

  const submitShift = async () => {
    const member = activeStaff.find(s => s.userId === shiftStaffId);
    if (!member || !shiftDate || shiftEnd <= shiftStart) return;
    await createShift({
      staffUserId: member.userId, staffName: member.displayName,
      date: shiftDate, start: shiftStart, end: shiftEnd,
    });
    setAddOpen(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Shifts</h1>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add shift
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Week of {week}</CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" onClick={() => setWeek(addDays(week, -7))} aria-label="Previous week">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => setWeek(addDays(week, 7))} aria-label="Next week">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-1.5 pr-2 font-medium">Staff</th>
                    {days.map(d => (
                      <th key={d} className="px-1 py-1.5 text-center font-medium">
                        {WEEKDAY_LABELS[new Date(`${d}T00:00:00`).getDay()]} {d.slice(8)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeStaff.map(member => (
                    <tr key={member.userId} className="border-t">
                      <td className="py-1.5 pr-2 font-medium">{member.displayName}</td>
                      {days.map(d => {
                        const dayShifts = shifts.filter(s => s.staffUserId === member.userId && s.date === d);
                        const off = isOnTimeOff(requests, member.userId, d);
                        return (
                          <td key={d} className="px-1 py-1.5 text-center align-top">
                            {off ? (
                              <Badge variant="outline">Off</Badge>
                            ) : dayShifts.length === 0 ? (
                              <span className="text-muted-foreground/40">—</span>
                            ) : (
                              dayShifts.map(s => (
                                <button
                                  key={s.id}
                                  type="button"
                                  disabled={!canManage}
                                  onClick={() => { if (canManage && confirm('Remove this shift?')) void deleteShift(s.id); }}
                                  className="block w-full rounded bg-primary/10 px-1 py-0.5 text-[11px] font-medium text-primary"
                                  title={canManage ? 'Click to remove' : undefined}
                                >
                                  {s.start}–{s.end}
                                </button>
                              ))
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4" /> Time off
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length === 0 && <p className="text-sm text-muted-foreground">No time-off requests.</p>}
          {requests.map(r => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{r.staffName}</p>
                <p className="text-xs text-muted-foreground">
                  {r.startDate} → {r.endDate}{r.reason ? ` · ${r.reason}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {r.status === 'requested' && canManage ? (
                  <>
                    <Button size="sm" onClick={() => void decideTimeOff(r.id, 'approved')}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => void decideTimeOff(r.id, 'declined')}>Decline</Button>
                  </>
                ) : (
                  <Badge variant={r.status === 'approved' ? 'secondary' : 'outline'}>
                    {r.status === 'requested' ? 'Pending' : r.status === 'approved' ? 'Approved' : 'Declined'}
                  </Badge>
                )}
                {(canManage || (r.staffUserId === user?.uid && r.status === 'requested')) && (
                  <Button variant="ghost" size="icon-sm" onClick={() => void deleteTimeOff(r.id)} aria-label="Delete request">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          <div className="space-y-2 rounded-lg border border-dashed p-3">
            <p className="text-sm font-medium">Request time off</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input type="date" value={offStart} onChange={e => setOffStart(e.target.value)} aria-label="Time off start" />
              <Input type="date" value={offEnd} min={offStart} onChange={e => setOffEnd(e.target.value)} aria-label="Time off end" />
              <Input value={offReason} onChange={e => setOffReason(e.target.value)} placeholder="Reason (optional)" aria-label="Reason" />
            </div>
            <Button
              size="sm"
              disabled={offEnd < offStart}
              onClick={async () => {
                await requestTimeOff({ startDate: offStart, endDate: offEnd, reason: offReason.trim() || undefined });
                setOffReason('');
              }}
            >
              Submit request
            </Button>
            {pendingRequests.length > 0 && canManage && (
              <p className="text-xs text-muted-foreground">{pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''} above.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add shift</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Staff member</Label>
              <Select value={shiftStaffId} onValueChange={v => setShiftStaffId(v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Pick a staff member" /></SelectTrigger>
                <SelectContent>
                  {activeStaff.map(s => <SelectItem key={s.userId} value={s.userId}>{s.displayName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="shift-date">Date</Label>
                <Input id="shift-date" type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shift-start">Start</Label>
                <Input id="shift-start" type="time" value={shiftStart} onChange={e => setShiftStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shift-end">End</Label>
                <Input id="shift-end" type="time" value={shiftEnd} onChange={e => setShiftEnd(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={submitShift} disabled={!shiftStaffId || shiftEnd <= shiftStart}>Add shift</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
