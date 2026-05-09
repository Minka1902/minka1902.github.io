import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, addWeeks, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Trash2, CalendarRange, Check, X, Clock, CalendarPlus } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import { useAuth } from '@/hooks/useAuth';
import { useRoutine, useRoutineWindow } from '@/hooks/useRoutine';
import { useMedicalWindow } from '@/hooks/useMedical';
import { useScheduledLogs, useScheduledLogsWindow } from '@/hooks/useScheduledLogs';
import { useBaseRoutine } from '@/hooks/useBaseRoutine';
import { ROUTINE_TYPES, QUICK_LOG_TYPES, PEE_COLOR, POOP_COLOR, MEDICAL_CATEGORY_META } from '@/lib/constants';
import { fmtTime, fmtDate, cn } from '@/lib/utils';
import BaseRoutineForm from '@/components/routine/BaseRoutineForm';
import ScheduleLogSheet from '@/components/routine/ScheduleLogSheet';
import type { RoutineLog, ScheduledLog } from '@/types';
import type { MedicalCalendarEvent } from '@/hooks/useMedical';

const DAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// dayIdx 0=Mon … 6=Sun — matches the DAYS order in BaseRoutineForm
function weekdayIdx(date: Date): number {
  const d = date.getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
}

function getRoutineMeta(log: RoutineLog) {
  if (log.type === 'pee')  return { icon: '🌿', color: PEE_COLOR,  label: 'Pee' };
  if (log.type === 'poop') return { icon: '💩', color: POOP_COLOR, label: 'Poop' };
  const rt = ROUTINE_TYPES.find(r => r.type === log.type);
  const label = log.type === 'custom' && log.customLabel ? log.customLabel : (rt?.label ?? log.type);
  return { icon: rt?.icon ?? '•', color: rt?.color ?? '#F59E0B', label };
}

function ActivityRow({ log, onDelete }: { log: RoutineLog; onDelete: (id: string) => void }) {
  const { icon, color, label } = getRoutineMeta(log);
  const sub = useMemo(() => {
    const parts: string[] = [];
    if (log.walkDurationMin) parts.push(`${Math.round(log.walkDurationMin)} min`);
    if (log.walkDistanceKm) parts.push(`${log.walkDistanceKm.toFixed(2)} km`);
    if (log.foodType) parts.push(log.foodType);
    if (log.notes) parts.push(log.notes);
    return parts.join(' · ');
  }, [log]);

  return (
    <div className="group flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
      <span className="text-[11px] font-medium text-muted-foreground tabular-nums w-14 shrink-0 pt-0.5">
        {fmtTime(log.timestamp)}
      </span>
      <div className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-base mt-0.5"
        style={{ backgroundColor: color + '18', border: `1.5px solid ${color}40` }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>}
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{log.loggedByName}</p>
      </div>
      <button onClick={() => onDelete(log.id)}
        className="opacity-0 group-hover:opacity-100 shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all mt-0.5"
        aria-label="Delete">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ScheduledLogRow({
  log, canDelete, onDelete,
}: { log: ScheduledLog; canDelete: boolean; onDelete: (id: string) => void }) {
  const rt = ROUTINE_TYPES.find(r => r.type === log.type);
  const now = Date.now();
  const color = rt?.color ?? '#F59E0B';

  const badge = useMemo(() => {
    if (log.status === 'pending_approval') return { label: 'Awaiting approval', bg: 'oklch(0.78 0.168 72 / 0.14)', fg: 'oklch(0.55 0.15 72)' };
    if (log.status === 'declined')         return { label: 'Declined',          bg: 'oklch(0.577 0.245 27 / 0.12)', fg: 'oklch(0.577 0.245 27)' };
    if (log.scheduledFor < now)            return { label: 'Overdue',           bg: 'oklch(0.577 0.245 27 / 0.12)', fg: 'oklch(0.577 0.245 27)' };
    return                                        { label: 'Scheduled',         bg: 'oklch(0.64 0.168 48 / 0.10)', fg: 'oklch(0.64 0.168 48)' };
  }, [log.status, log.scheduledFor, now]);

  return (
    <div className="group flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
      <span className="text-[11px] font-medium text-muted-foreground tabular-nums w-14 shrink-0 pt-0.5">
        {fmtTime(log.scheduledFor)}
      </span>
      <div className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-base mt-0.5"
        style={{ backgroundColor: color + '10', border: `1.5px dashed ${color}50` }}>
        {rt?.icon ?? '📋'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-semibold leading-tight">{rt?.label ?? log.type}</p>
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: badge.bg, color: badge.fg }}>
            {badge.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {log.assignedToName}
          {log.reason && <span className="text-muted-foreground/60"> · {log.reason}</span>}
        </p>
      </div>
      {canDelete && (
        <button onClick={() => onDelete(log.id)}
          className="opacity-0 group-hover:opacity-100 shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all mt-0.5"
          aria-label="Cancel">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function PendingApprovalRow({
  log, onApprove, onDecline,
}: { log: ScheduledLog; onApprove: () => Promise<void>; onDecline: () => Promise<void> }) {
  const rt = ROUTINE_TYPES.find(r => r.type === log.type);
  const [state, setState] = useState<'idle' | 'approving' | 'declining'>('idle');

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-base"
          style={{ backgroundColor: (rt?.color ?? '#F59E0B') + '18', border: `1.5px dashed ${(rt?.color ?? '#F59E0B')}50` }}>
          {rt?.icon ?? '📋'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">{rt?.label ?? log.type}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(log.scheduledFor), 'EEE, MMM d · h:mm a')}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            From {log.createdByName}{log.reason ? ` · "${log.reason}"` : ''}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-2.5 ml-11">
        <button
          disabled={state !== 'idle'}
          onClick={async () => { setState('declining'); await onDecline(); setState('idle'); }}
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold border border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition-all disabled:opacity-50"
        >
          {state === 'declining' ? '…' : 'Decline'}
        </button>
        <button
          disabled={state !== 'idle'}
          onClick={async () => { setState('approving'); await onApprove(); setState('idle'); }}
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          style={{ backgroundColor: 'oklch(0.64 0.168 48 / 0.12)', color: 'oklch(0.64 0.168 48)' }}
        >
          {state === 'approving' ? '…' : 'Approve'}
        </button>
      </div>
    </div>
  );
}

function MedicalEventRow({ event }: { event: MedicalCalendarEvent }) {
  const meta = MEDICAL_CATEGORY_META[event.record.category] ?? { icon: '🏥', color: '#6366F1' };
  const isDue = event.eventType === 'due';
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
      <span className="text-[11px] font-medium text-muted-foreground tabular-nums w-14 shrink-0 pt-0.5">
        {isDue ? fmtDate(event.eventDate) : fmtTime(event.eventDate)}
      </span>
      <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-base mt-0.5"
        style={{ backgroundColor: meta.color + '18', border: `1.5px solid ${meta.color}40` }}>
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{event.record.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isDue ? '⏰ Due' : '✓ Administered'}
          {event.record.provider ? ` · ${event.record.provider}` : ''}
        </p>
      </div>
      {isDue && (
        <span className="text-[10px] font-bold uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0 mt-1">Due</span>
      )}
    </div>
  );
}

export default function RoutinePage() {
  const navigate = useNavigate();
  const { activeDog, isMainHuman } = useDog();
  const { user } = useAuth();
  const [showBaseRoutine, setShowBaseRoutine] = useState(false);
  const [showScheduleSheet, setShowScheduleSheet] = useState(false);
  const [showCustomLog, setShowCustomLog] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [savingCustom, setSavingCustom] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const weekStart = useMemo(() => startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 }), [today, weekOffset]);
  const weekDays  = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const windowStart = weekStart.getTime();
  const windowEnd   = addDays(weekStart, 7).getTime() - 1;

  const windowLogs    = useRoutineWindow(activeDog?.id ?? '', windowStart, windowEnd);
  const medicalEvents = useMedicalWindow(activeDog?.id ?? '', windowStart, windowEnd);
  const scheduledLogs = useScheduledLogsWindow(activeDog?.id ?? '', windowStart, windowEnd);
  const { logs: allScheduledLogs, createScheduledLog, approveScheduledLog, declineScheduledLog, deleteScheduledLog } = useScheduledLogs(activeDog?.id ?? '');
  const { deleteLog, logRoutine } = useRoutine(activeDog?.id ?? '');
  const { slots: baseSlots } = useBaseRoutine(activeDog?.id ?? '');

  const isLead = activeDog ? isMainHuman(activeDog.id) : false;

  // Tasks this user needs to approve
  const pendingForMe = useMemo(
    () => allScheduledLogs.filter(l => l.assignedTo === user?.uid && l.status === 'pending_approval'),
    [allScheduledLogs, user?.uid],
  );

  useEffect(() => { if (showCustomLog) customInputRef.current?.focus(); }, [showCustomLog]);

  const handleSaveCustom = async () => {
    const label = customLabel.trim();
    if (!label) return;
    setSavingCustom(true);
    await logRoutine('custom', { customLabel: label });
    setCustomLabel(''); setShowCustomLog(false); setSavingCustom(false);
  };

  const logsByDay = useMemo(() => {
    const map = new Map<string, RoutineLog[]>();
    windowLogs.forEach(log => {
      const key = format(new Date(log.timestamp), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(log);
    });
    return map;
  }, [windowLogs]);

  const medicalByDay = useMemo(() => {
    const map = new Map<string, MedicalCalendarEvent[]>();
    medicalEvents.forEach(evt => {
      const key = format(new Date(evt.eventDate), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(evt);
    });
    return map;
  }, [medicalEvents]);

  const scheduledByDay = useMemo(() => {
    const map = new Map<string, ScheduledLog[]>();
    scheduledLogs.forEach(log => {
      const key = format(new Date(log.scheduledFor), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(log);
    });
    return map;
  }, [scheduledLogs]);

  // Types that appear in base routine for a given day
  const baseTypesForDay = (day: Date): Set<string> => {
    const dayIdx = weekdayIdx(day);
    const types = new Set<string>();
    Object.entries(baseSlots).forEach(([key, type]) => {
      // key format: "{dayIdx}_{time}"
      if (key.startsWith(`${dayIdx}_`)) types.add(type);
    });
    return types;
  };

  const getDots = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd');
    const routineLogs = logsByDay.get(key) ?? [];
    const medEvts = medicalByDay.get(key) ?? [];
    const dayScheduled = scheduledByDay.get(key) ?? [];
    const confirmedSched = dayScheduled.filter(l => l.status === 'scheduled' || (l.status !== 'declined' && l.status !== 'pending_approval'));
    const pendingSched   = dayScheduled.filter(l => l.status === 'pending_approval');
    const baseTypes = baseTypesForDay(day);

    const seen = new Set<string>();
    const dots: { color: string; shape: 'circle' | 'square' | 'diamond' | 'ghost-diamond' | 'ring' }[] = [];

    for (const l of routineLogs) {
      if (seen.has(l.type)) continue;
      seen.add(l.type);
      let color = ROUTINE_TYPES.find(r => r.type === l.type)?.color ?? '#F59E0B';
      if (l.type === 'pee')  color = PEE_COLOR;
      if (l.type === 'poop') color = POOP_COLOR;
      dots.push({ color, shape: 'circle' });
      if (dots.length >= 4) break;
    }

    // Base routine items not yet logged today — shown as faint rings
    if (dots.length < 4) {
      for (const type of baseTypes) {
        if (seen.has(type)) continue;
        seen.add(type);
        const color = ROUTINE_TYPES.find(r => r.type === type)?.color ?? '#F59E0B';
        dots.push({ color, shape: 'ring' });
        if (dots.length >= 4) break;
      }
    }

    const seenMedCat = new Set<string>();
    for (const evt of medEvts) {
      if (dots.length >= 4) break;
      const cat = evt.record.category;
      if (seenMedCat.has(cat)) continue;
      seenMedCat.add(cat);
      dots.push({ color: MEDICAL_CATEGORY_META[cat]?.color ?? '#6366F1', shape: 'square' });
    }

    if (confirmedSched.length > 0 && dots.length < 4) {
      dots.push({ color: 'oklch(0.64 0.168 48)', shape: 'diamond' });
    }

    if (pendingSched.length > 0 && dots.length < 4) {
      dots.push({ color: 'oklch(0.64 0.168 48)', shape: 'ghost-diamond' });
    }

    return dots.slice(0, 4);
  };

  const selectedDayLogs = useMemo(() => {
    const key = format(selectedDate, 'yyyy-MM-dd');
    return (logsByDay.get(key) ?? []).sort((a, b) => b.timestamp - a.timestamp);
  }, [logsByDay, selectedDate]);

  const selectedDayMedical  = useMemo(() => { const k = format(selectedDate, 'yyyy-MM-dd'); return medicalByDay.get(k) ?? []; }, [medicalByDay, selectedDate]);
  const selectedDayScheduled = useMemo(() => { const k = format(selectedDate, 'yyyy-MM-dd'); return (scheduledByDay.get(k) ?? []).filter(l => l.status !== 'declined' && l.status !== 'pending_approval'); }, [scheduledByDay, selectedDate]);
  const selectedDayPending   = useMemo(() => { const k = format(selectedDate, 'yyyy-MM-dd'); return (scheduledByDay.get(k) ?? []).filter(l => l.status === 'pending_approval'); }, [scheduledByDay, selectedDate]);

  const handleWeekChange = (dir: number) => { setWeekOffset(weekOffset + dir); setSelectedDate(prev => addWeeks(prev, dir)); };

  const isSelectedInWindow = weekDays.some(d => isSameDay(d, selectedDate));
  const headerDate = isSelectedInWindow ? selectedDate : weekDays[0];
  const totalEntries = selectedDayLogs.length + selectedDayMedical.length + selectedDayScheduled.length + selectedDayPending.length;

  if (!activeDog) return <div className="text-muted-foreground p-4">No active dog selected.</div>;

  return (
    <div className="max-w-lg mx-auto flex flex-col h-full">
      {/* ── Page header ── */}
      <div className="px-1 pt-1 pb-4 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Activity</h1>
          <p className="text-sm text-muted-foreground capitalize mt-0.5">{activeDog.name}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {isLead && (
            <button onClick={() => setShowScheduleSheet(true)}
              className="flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold border border-primary/30 text-primary hover:bg-primary/8 transition-colors">
              <CalendarPlus className="h-3.5 w-3.5" /> Schedule
            </button>
          )}
          <button onClick={() => setShowBaseRoutine(true)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <CalendarRange className="h-3.5 w-3.5" /> Base Routine
          </button>
        </div>
      </div>

      {/* ── Base Routine slide-over ── */}
      {showBaseRoutine && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowBaseRoutine(false)} />
          <div className="relative ml-auto w-full max-w-lg bg-card flex flex-col h-full shadow-2xl">
            <BaseRoutineForm dogId={activeDog.id} onClose={() => setShowBaseRoutine(false)} />
          </div>
        </div>
      )}

      {/* ── Schedule log slide-over ── */}
      {showScheduleSheet && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowScheduleSheet(false)} />
          <div className="relative ml-auto w-full max-w-lg bg-card flex flex-col h-full shadow-2xl">
            <ScheduleLogSheet dogId={activeDog.id} onSave={createScheduledLog} onClose={() => setShowScheduleSheet(false)} />
          </div>
        </div>
      )}

      {/* ── Pending approvals banner ── */}
      {pendingForMe.length > 0 && (
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden mb-4">
          <div className="px-4 py-2.5 border-b border-border/50 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="text-sm font-semibold flex-1">Awaiting your approval</span>
            <span className="text-xs text-muted-foreground">
              {pendingForMe.length} task{pendingForMe.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-border/40">
            {pendingForMe.map(log => (
              <PendingApprovalRow
                key={log.id}
                log={log}
                onApprove={() => approveScheduledLog(log.id)}
                onDecline={() => declineScheduledLog(log.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Calendar strip ── */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
            {format(headerDate, 'MMMM yyyy')}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => handleWeekChange(-1)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => { setWeekOffset(0); setSelectedDate(today); }} className="px-2 h-7 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              Today
            </button>
            <button onClick={() => handleWeekChange(1)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 px-2 py-3 gap-1">
          {weekDays.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday_   = isSameDay(day, today);
            const dots       = getDots(day);
            return (
              <button key={i} onClick={() => setSelectedDate(day)}
                className="flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl transition-all"
                style={isSelected ? { backgroundColor: 'oklch(0.64 0.168 48)', color: '#1a1612' } : undefined}>
                <span className={cn('text-[10px] font-semibold uppercase tracking-wider', isSelected ? 'text-[#1a1612]/70' : 'text-muted-foreground')}>
                  {DAY_ABBR[i]}
                </span>
                <span className={cn('text-base font-bold leading-none',
                  !isSelected && isToday_ && 'text-amber-500',
                  !isSelected && !isToday_ && 'text-foreground')}
                  style={{ fontFamily: 'var(--font-heading)' }}>
                  {format(day, 'd')}
                </span>
                <div className="flex gap-0.5 h-2 items-center">
                  {dots.map((dot, di) => (
                    dot.shape === 'diamond' ? (
                      <div key={di} className="h-1.5 w-1.5 rotate-45 rounded-[1px]"
                        style={{ backgroundColor: isSelected ? '#1a1612' : dot.color }} />
                    ) : dot.shape === 'ghost-diamond' ? (
                      <div key={di} className="h-1.5 w-1.5 rotate-45 rounded-[1px] border"
                        style={{ borderColor: isSelected ? '#1a1612' : dot.color + '80', backgroundColor: 'transparent' }} />
                    ) : dot.shape === 'ring' ? (
                      <div key={di} className="h-1.5 w-1.5 rounded-full border"
                        style={{ borderColor: isSelected ? '#1a1612' : dot.color + '80', backgroundColor: 'transparent' }} />
                    ) : (
                      <div key={di} className={dot.shape === 'square' ? 'h-1.5 w-1.5 rounded-sm' : 'h-1.5 w-1.5 rounded-full'}
                        style={{ backgroundColor: isSelected ? '#1a1612' : dot.color }} />
                    )
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Calendar legend ── */}
        <div className="px-4 pb-2.5 flex items-center flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground/60">
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" /> logged
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full border border-current" style={{ backgroundColor: 'transparent' }} /> base routine
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rotate-45 rounded-[1px] bg-current" /> scheduled
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rotate-45 rounded-[1px] border border-current" style={{ backgroundColor: 'transparent' }} /> pending
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-sm bg-current" /> medical
          </span>
        </div>
      </div>

      {/* ── Quick log strip ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
        {QUICK_LOG_TYPES.map(({ type, label, icon, color }) => (
          type === 'walk' ? (
            <button key={type} onClick={() => navigate('/walk/active')}
              className="flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95"
              style={{ backgroundColor: color + '18', border: `1.5px solid ${color}40`, color }}>
              <span>{icon}</span> {label}
            </button>
          ) : (
            <LogButton key={type} type={type} label={label} icon={icon} color={color} dogId={activeDog.id} />
          )
        ))}
        <button onClick={() => setShowCustomLog(true)}
          className="flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95 border border-dashed border-border/60 text-muted-foreground hover:text-foreground">
          + Log activity
        </button>
      </div>

      {/* ── Inline custom log form ── */}
      {showCustomLog && (
        <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 mb-4 shadow-sm">
          <span className="text-xl shrink-0">✏️</span>
          <input ref={customInputRef} value={customLabel} onChange={e => setCustomLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveCustom(); if (e.key === 'Escape') { setShowCustomLog(false); setCustomLabel(''); } }}
            placeholder="What happened? (e.g. grooming, vet visit…)"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" disabled={savingCustom} />
          <button onClick={() => { setShowCustomLog(false); setCustomLabel(''); }}
            className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors" aria-label="Cancel">
            <X className="h-4 w-4" />
          </button>
          <button onClick={handleSaveCustom} disabled={!customLabel.trim() || savingCustom}
            className={cn('shrink-0 p-1 rounded-md transition-colors', customLabel.trim() ? 'text-primary hover:text-primary/80' : 'text-muted-foreground/40 cursor-not-allowed')}
            aria-label="Save">
            <Check className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Day activity list ── */}
      <div className="rounded-2xl border bg-card shadow-sm flex-1 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
            {isSameDay(selectedDate, today) ? 'Today' : format(selectedDate, 'EEEE, MMM d')}
          </span>
          <span className="text-xs text-muted-foreground">{totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}</span>
        </div>

        <div className="px-4 overflow-y-auto max-h-[50vh]">
          {totalEntries === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl mb-3">🐾</span>
              <p className="text-sm font-medium text-muted-foreground">No activity logged</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {isSameDay(selectedDate, today) ? 'Use the buttons above to log activity.' : 'Nothing was logged on this day.'}
              </p>
            </div>
          ) : (
            <>
              {selectedDayPending.length > 0 && (
                <>
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex-1 h-px bg-border/40" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> Hypothetical
                    </span>
                    <div className="flex-1 h-px bg-border/40" />
                  </div>
                  <div className="opacity-50">
                    {selectedDayPending.map(log => (
                      <ScheduledLogRow key={log.id} log={log} canDelete={isLead} onDelete={deleteScheduledLog} />
                    ))}
                  </div>
                </>
              )}
              {selectedDayScheduled.length > 0 && (
                <>
                  <div className="flex items-center gap-2 py-2">
                    {selectedDayLogs.length > 0 && <div className="flex-1 h-px bg-border/40" />}
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> Scheduled
                    </span>
                    {selectedDayLogs.length > 0 && <div className="flex-1 h-px bg-border/40" />}
                  </div>
                  {selectedDayScheduled.map(log => (
                    <ScheduledLogRow key={log.id} log={log} canDelete={isLead} onDelete={deleteScheduledLog} />
                  ))}
                </>
              )}
              {selectedDayLogs.map(log => <ActivityRow key={log.id} log={log} onDelete={deleteLog} />)}
              {selectedDayMedical.length > 0 && (
                <>
                  {(selectedDayLogs.length > 0 || selectedDayScheduled.length > 0 || selectedDayPending.length > 0) && (
                    <div className="flex items-center gap-2 py-2">
                      <div className="flex-1 h-px bg-border/40" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Medical</span>
                      <div className="flex-1 h-px bg-border/40" />
                    </div>
                  )}
                  {selectedDayMedical.map((evt, i) => <MedicalEventRow key={`${evt.record.id}-${evt.eventType}-${i}`} event={evt} />)}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LogButton({ type, label, icon, color, dogId }: { type: string; label: string; icon: string; color: string; dogId: string }) {
  const [loading, setLoading] = useState(false);
  const { logRoutine } = useRoutine(dogId);
  const handleClick = async () => { if (loading) return; setLoading(true); await logRoutine(type as import('@/types').RoutineType); setLoading(false); };
  return (
    <button onClick={handleClick} disabled={loading}
      className="flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95 disabled:opacity-50"
      style={{ backgroundColor: color + '18', border: `1.5px solid ${color}40`, color }}>
      <span>{loading ? '…' : icon}</span> {label}
    </button>
  );
}
