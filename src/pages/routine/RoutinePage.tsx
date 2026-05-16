import { useState, useMemo, useRef, useEffect } from 'react';
import { format, addDays, startOfWeek, addWeeks, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarRange, X, Clock, CalendarPlus, GripVertical, Pencil } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useDog } from '@/contexts/DogContext';
import { useAuth } from '@/hooks/useAuth';
import { useRoutine, useRoutineWindow } from '@/hooks/useRoutine';
import { useMedicalWindow, useActiveMedications } from '@/hooks/useMedical';
import { useScheduledLogs, useScheduledLogsWindow } from '@/hooks/useScheduledLogs';
import { useBaseRoutine } from '@/hooks/useBaseRoutine';
import { useTraining } from '@/hooks/useTraining';
import { ROUTINE_TYPES, QUICK_LOG_TYPES, PEE_COLOR, POOP_COLOR, MEDICAL_CATEGORY_META, MEDICAL_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import BaseRoutineForm from '@/components/routine/BaseRoutineForm';
import DayTimeline from '@/components/routine/DayTimeline';
import ScheduleLogSheet from '@/components/routine/ScheduleLogSheet';
import AssignRoutineSheet from '@/components/routine/AssignRoutineSheet';
import DogSelectForWalkDialog from '@/components/walk/DogSelectForWalkDialog';
import type { RoutineLog, ScheduledLog } from '@/types';
import type { MedicalCalendarEvent } from '@/hooks/useMedical';
import type { MedicalRecord } from '@/types';

const DAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type SectionId = 'calendar' | 'quicklog' | 'timeline';
const DEFAULT_SECTION_ORDER: SectionId[] = ['calendar', 'quicklog', 'timeline'];
const LAYOUT_KEY = 'packops_routine_layout';

function loadSectionOrder(): SectionId[] {
  try {
    const saved = localStorage.getItem(LAYOUT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as SectionId[];
      if (Array.isArray(parsed) && parsed.length === DEFAULT_SECTION_ORDER.length &&
          DEFAULT_SECTION_ORDER.every(id => parsed.includes(id))) return parsed;
    }
  } catch { /* ignore */ }
  return DEFAULT_SECTION_ORDER;
}

// dayIdx 0=Mon … 6=Sun — matches the DAYS order in BaseRoutineForm
function weekdayIdx(date: Date): number {
  const d = date.getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
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


export default function RoutinePage() {
  const { activeDog, isMainHuman } = useDog();
  const { user } = useAuth();
  const [showBaseRoutine, setShowBaseRoutine] = useState(false);
  const [showWalkDialog, setShowWalkDialog] = useState(false);
  const [pendingBaseInfo, setPendingBaseInfo] = useState<{ type: string; scheduledMs: number } | null>(null);
  const [editLayout, setEditLayout] = useState(false);
  const [sections, setSections] = useState<SectionId[]>(loadSectionOrder);
  const dragSectionRef = useRef<SectionId | null>(null);
  const [showScheduleSheet, setShowScheduleSheet] = useState(false);
  const [showCustomLog, setShowCustomLog] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customDateTime, setCustomDateTime] = useState('');
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
  const medicalEvents    = useMedicalWindow(activeDog?.id ?? '', windowStart, windowEnd);
  const activeMedications = useActiveMedications(activeDog?.id ?? '');
  const scheduledLogs = useScheduledLogsWindow(activeDog?.id ?? '', windowStart, windowEnd);
  const { logs: allScheduledLogs, createScheduledLog, approveScheduledLog, declineScheduledLog, completeScheduledLog, deleteScheduledLog } = useScheduledLogs(activeDog?.id ?? '');
  const { deleteLog, logRoutine, updateLogTimestamp } = useRoutine(activeDog?.id ?? '');
  const { slots: baseSlots, save: saveBaseSlots } = useBaseRoutine(activeDog?.id ?? '');
  const [crossDayDrag, setCrossDayDrag] = useState<{ logId: string; timeOfDayMs: number } | null>(null);

  const { sessions: trainingSessions } = useTraining(activeDog?.id ?? '');

  const isLead = activeDog ? isMainHuman(activeDog.id) : false;

  // Tasks this user needs to approve
  const pendingForMe = useMemo(
    () => allScheduledLogs.filter(l => l.assignedTo === user?.uid && l.status === 'pending_approval'),
    [allScheduledLogs, user?.uid],
  );

  useEffect(() => { if (showCustomLog) customInputRef.current?.focus(); }, [showCustomLog]);

  const handleConfirmScheduled = async (log: ScheduledLog) => {
    await completeScheduledLog(log.id);
    await logRoutine(log.type, { timestamp: log.scheduledFor });
  };

  const handleConfirmMedical = async (event: MedicalCalendarEvent) => {
    const r = event.record as MedicalRecord;
    const colName = MEDICAL_CATEGORIES.find(c => c.category === r.category)?.collectionName;
    if (!colName || !activeDog) return;
    await updateDoc(doc(db, 'dogs', activeDog.id, colName, r.id), { date: Date.now(), updatedAt: Date.now() });
  };

  const handleSaveCustom = async () => {
    const label = customLabel.trim();
    if (!label) return;
    setSavingCustom(true);
    const ts = customDateTime ? new Date(customDateTime).getTime() : Date.now();
    await logRoutine('custom', { customLabel: label, timestamp: ts });
    setCustomLabel(''); setCustomDateTime(''); setShowCustomLog(false); setSavingCustom(false);
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
    return (logsByDay.get(key) ?? []).sort((a, b) => a.timestamp - b.timestamp);
  }, [logsByDay, selectedDate]);

  const selectedDayMedical  = useMemo(() => { const k = format(selectedDate, 'yyyy-MM-dd'); return medicalByDay.get(k) ?? []; }, [medicalByDay, selectedDate]);
  const selectedDayScheduled = useMemo(() => { const k = format(selectedDate, 'yyyy-MM-dd'); return (scheduledByDay.get(k) ?? []).filter(l => l.status !== 'declined' && l.status !== 'pending_approval'); }, [scheduledByDay, selectedDate]);
  const selectedDayPending   = useMemo(() => { const k = format(selectedDate, 'yyyy-MM-dd'); return (scheduledByDay.get(k) ?? []).filter(l => l.status === 'pending_approval'); }, [scheduledByDay, selectedDate]);
  const selectedDayTraining  = useMemo(() => {
    const k = format(selectedDate, 'yyyy-MM-dd');
    return trainingSessions.filter(s => format(new Date(s.scheduledAt), 'yyyy-MM-dd') === k);
  }, [trainingSessions, selectedDate]);

  const handleWeekChange = (dir: number) => { setWeekOffset(weekOffset + dir); setSelectedDate(prev => addWeeks(prev, dir)); };

  const isSelectedInWindow = weekDays.some(d => isSameDay(d, selectedDate));
  const headerDate = isSelectedInWindow ? selectedDate : weekDays[0];

  if (!activeDog) return <div className="text-muted-foreground p-4">No active dog selected.</div>;

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full max-w-2xl lg:flex-1 lg:overflow-y-auto lg:p-4">
    <div className="flex flex-col min-h-0">
      {/* ── Page header ── */}
      <div className="px-1 pt-1 pb-4 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Activity</h1>
          <p className="text-sm text-muted-foreground capitalize mt-0.5">{activeDog.name}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {editLayout ? (
            <button onClick={() => setEditLayout(false)}
              className="flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Done
            </button>
          ) : (
            <>
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
              <button onClick={() => setEditLayout(true)}
                className="h-8 w-8 rounded-full flex items-center justify-center border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Edit layout">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </>
          )}
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

      {/* ── Reorderable sections ── */}
      {sections.map(sectionId => {
        const handleDragStart = (e: React.DragEvent) => { e.stopPropagation(); dragSectionRef.current = sectionId; };
        const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
        const handleDrop      = (e: React.DragEvent) => {
          e.preventDefault(); e.stopPropagation();
          const from = dragSectionRef.current;
          if (!from || from === sectionId) return;
          setSections(prev => {
            const next = [...prev];
            const fi = next.indexOf(from), ti = next.indexOf(sectionId);
            next.splice(fi, 1); next.splice(ti, 0, from);
            localStorage.setItem(LAYOUT_KEY, JSON.stringify(next));
            return next;
          });
          dragSectionRef.current = null;
        };
        const dragLabel = sectionId === 'calendar' ? 'Calendar' : sectionId === 'quicklog' ? 'Quick Log' : 'Timeline';

        if (sectionId === 'calendar') return (
          <div key="calendar" draggable={editLayout} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
            className={cn('relative', editLayout && 'cursor-grab')}>
            {editLayout && (
              <div className="absolute -top-0 left-2 z-10 flex items-center gap-1 bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5 pointer-events-none select-none">
                <GripVertical className="h-3 w-3 text-primary/60" />
                <span className="text-[9px] font-semibold text-primary/60 uppercase tracking-wider">{dragLabel}</span>
              </div>
            )}
      {/* ── Calendar strip ── */}
      <div className={cn('rounded-2xl border bg-card shadow-sm overflow-hidden mb-4', editLayout && 'ring-1 ring-dashed ring-primary/30')}>
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
            const isSelected    = isSameDay(day, selectedDate);
            const isToday_      = isSameDay(day, today);
            const dots          = getDots(day);
            const isCrossDrop   = crossDayDrag !== null && !isSelected;
            return (
              <button key={i}
                onClick={() => setSelectedDate(day)}
                onDragOver={isCrossDrop ? e => e.preventDefault() : undefined}
                onDrop={isCrossDrop ? async e => {
                  e.preventDefault();
                  if (!crossDayDrag) return;
                  const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
                  const newTs = dayStart.getTime() + crossDayDrag.timeOfDayMs;
                  await updateLogTimestamp(crossDayDrag.logId, newTs);
                  setSelectedDate(day);
                  setCrossDayDrag(null);
                } : undefined}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl transition-all",
                  isCrossDrop && "ring-2 ring-primary/50 ring-offset-1",
                )}
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
          </div>
        );

        if (sectionId === 'quicklog') return (
          <div key="quicklog" draggable={editLayout} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
            className={cn('relative', editLayout && 'cursor-grab')}>
            {editLayout && (
              <div className="absolute -top-0 left-2 z-10 flex items-center gap-1 bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5 pointer-events-none select-none">
                <GripVertical className="h-3 w-3 text-primary/60" />
                <span className="text-[9px] font-semibold text-primary/60 uppercase tracking-wider">{dragLabel}</span>
              </div>
            )}
      {/* ── Quick log strip ── */}
      <div className={cn('flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none', editLayout && 'ring-1 ring-dashed ring-primary/30 rounded-full px-2 pt-2')}>
        {QUICK_LOG_TYPES.map(({ type, label, icon, color }) => (
          type === 'walk' ? (
            <button key={type} onClick={() => setShowWalkDialog(true)}
              className="flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95"
              style={{ backgroundColor: color + '18', border: `1.5px solid ${color}40`, color }}>
              <span>{icon}</span> {label}
            </button>
          ) : (
            <LogButton key={type} type={type} label={label} icon={icon} color={color} dogId={activeDog.id} />
          )
        ))}
        <button onClick={() => { setShowCustomLog(true); setCustomDateTime(format(new Date(), "yyyy-MM-dd'T'HH:mm")); }}
          className="flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95 border border-dashed border-border/60 text-muted-foreground hover:text-foreground">
          + Log activity
        </button>
      </div>

      {/* ── Inline custom log form ── */}
      {showCustomLog && (
        <div className="rounded-xl border bg-card px-3 py-2.5 mb-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl shrink-0">✏️</span>
            <input ref={customInputRef} value={customLabel} onChange={e => setCustomLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveCustom(); if (e.key === 'Escape') { setShowCustomLog(false); setCustomLabel(''); setCustomDateTime(''); } }}
              placeholder="What happened? (e.g. grooming, vet visit…)"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" disabled={savingCustom} />
            <button onClick={() => { setShowCustomLog(false); setCustomLabel(''); setCustomDateTime(''); }}
              className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors" aria-label="Cancel">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 pl-8">
            <input
              type="datetime-local"
              value={customDateTime}
              onChange={e => setCustomDateTime(e.target.value)}
              className="flex-1 text-xs bg-background border border-input rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-ring text-foreground"
              disabled={savingCustom}
            />
            <button onClick={handleSaveCustom} disabled={!customLabel.trim() || savingCustom}
              className={cn('shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-colors', customLabel.trim() && !savingCustom ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-muted-foreground/40 cursor-not-allowed')}>
              {savingCustom ? 'Saving…' : 'Log'}
            </button>
          </div>
        </div>
      )}
          </div>
        );

        // sectionId === 'timeline'
        return (
          <div key="timeline" draggable={editLayout} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
            className={cn('relative flex flex-col flex-1 min-h-0', editLayout && 'cursor-grab')}>
            {editLayout && (
              <div className="flex items-center gap-1 mb-1 pl-1">
                <GripVertical className="h-3 w-3 text-primary/60" />
                <span className="text-[9px] font-semibold text-primary/60 uppercase tracking-wider">{dragLabel}</span>
              </div>
            )}
      {/* ── Day timeline ── */}
      <DayTimeline
        selectedDate={selectedDate}
        isToday={isSameDay(selectedDate, today)}
        baseSlots={baseSlots}
        allBaseSlots={baseSlots}
        onSaveBaseSlots={saveBaseSlots}
        logs={selectedDayLogs}
        scheduledLogs={[...selectedDayScheduled, ...selectedDayPending]}
        medicalEvents={selectedDayMedical}
        dogId={activeDog.id}
        onLogDeleted={deleteLog}
        onScheduledLogDeleted={deleteScheduledLog}
        onScheduledLogConfirmed={handleConfirmScheduled}
        onMedicalConfirmed={handleConfirmMedical}
        onCrossDayDragStart={(logId, timeOfDayMs) => setCrossDayDrag({ logId, timeOfDayMs })}
        onCrossDayDragEnd={() => setCrossDayDrag(null)}
        onPendingBaseSlotClick={(type, scheduledMs) => setPendingBaseInfo({ type, scheduledMs })}
        onRescheduleLog={updateLogTimestamp}
        trainingSessions={selectedDayTraining}
        activeMedications={activeMedications}
      />
          </div>
        );
      })}

      {pendingBaseInfo && (
        <AssignRoutineSheet
          dogId={activeDog.id}
          type={pendingBaseInfo.type}
          scheduledMs={pendingBaseInfo.scheduledMs}
          onClose={() => setPendingBaseInfo(null)}
        />
      )}

      {showWalkDialog && <DogSelectForWalkDialog onClose={() => setShowWalkDialog(false)} />}
    </div>

    </div>
  );
}

function LogButton({ type, label, icon, color, dogId }: { type: string; label: string; icon: string; color: string; dogId: string }) {
  const [open, setOpen] = useState(false);
  const [logTime, setLogTime] = useState('');
  const [loading, setLoading] = useState(false);
  const { logRoutine } = useRoutine(dogId);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) setLogTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setOpen(isOpen);
  };

  const handleLog = async () => {
    if (loading) return;
    setLoading(true);
    const ts = logTime ? new Date(logTime).getTime() : Date.now();
    await logRoutine(type as import('@/types').RoutineType, { timestamp: ts });
    setLoading(false);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95"
          style={{ backgroundColor: color + '18', border: `1.5px solid ${color}40`, color }}>
          <span>{icon}</span> {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="space-y-2.5">
          <p className="text-xs font-semibold">{icon} Log {label}</p>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">When</label>
            <input
              type="datetime-local"
              value={logTime}
              onChange={e => setLogTime(e.target.value)}
              className="w-full text-xs bg-background border border-input rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-ring text-foreground"
            />
          </div>
          <button
            onClick={handleLog}
            disabled={loading}
            className="w-full py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            style={{ backgroundColor: color + '20', border: `1.5px solid ${color}50`, color }}>
            {loading ? 'Logging…' : `Log ${label}`}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
