import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Settings } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { makeSlotKey } from '@/hooks/useBaseRoutine';
import { ROUTINE_TYPES, PEE_COLOR, POOP_COLOR } from '@/lib/constants';
import { fmtTime } from '@/lib/utils';
import {
  PX_PER_HOUR, minutesToPx, pxToTimeStr, timeStrToMinutes,
  matchSlotsToLogs, loadTimeRange, saveTimeRange,
} from '@/lib/timelineUtils';
import TimelineBlock from './TimelineBlock';
import AllDayStrip from './AllDayStrip';
import QuickAddPopover from './QuickAddPopover';
import LogDetailSheet from './LogDetailSheet';
import { useNavigate } from 'react-router-dom';
import type { RoutineLog, ScheduledLog, TrainingSession } from '@/types';
import type { LogSelection } from './LogDetailSheet';
import type { BaseRoutineSlots } from '@/hooks/useBaseRoutine';
import type { MedicalCalendarEvent } from '@/hooks/useMedical';
import type { StatusBadge, SubLogChip } from './TimelineBlock';

type SaveBaseSlots = (slots: BaseRoutineSlots) => Promise<void>;

export interface DayTimelineProps {
  selectedDate: Date;
  isToday: boolean;
  baseSlots: BaseRoutineSlots;
  allBaseSlots: BaseRoutineSlots;
  onSaveBaseSlots: SaveBaseSlots;
  logs: RoutineLog[];
  scheduledLogs: ScheduledLog[];
  medicalEvents: MedicalCalendarEvent[];
  dogId: string;
  onLogDeleted: (id: string) => void;
  onScheduledLogDeleted: (id: string) => void;
  onScheduledLogConfirmed?: (log: ScheduledLog) => void;
  onMedicalConfirmed?: (event: MedicalCalendarEvent) => void;
  onCrossDayDragStart?: (logId: string, timeOfDayMs: number) => void;
  onCrossDayDragEnd?: () => void;
  onPendingBaseSlotClick?: (type: string, scheduledMs: number) => void;
  trainingSessions?: TrainingSession[];
}

function getRoutineMeta(type: string, customLabel?: string) {
  if (type === 'pee')  return { icon: '🌿', color: PEE_COLOR,  label: 'Pee' };
  if (type === 'poop') return { icon: '💩', color: POOP_COLOR, label: 'Poop' };
  const rt = ROUTINE_TYPES.find(r => r.type === type);
  return {
    icon:  rt?.icon  ?? '•',
    color: rt?.color ?? '#F59E0B',
    label: type === 'custom' && customLabel ? customLabel : (rt?.label ?? type),
  };
}

interface BlockLayoutInfo { id: string; top: number; bottom: number; }

function computeColumns(blocks: BlockLayoutInfo[]): Map<string, { col: number; totalCols: number }> {
  if (!blocks.length) return new Map();
  const sorted = [...blocks].sort((a, b) => a.top - b.top);

  // Group into clusters (connected components of overlapping blocks)
  const clusters: BlockLayoutInfo[][] = [];
  let group = [sorted[0]];
  let groupEnd = sorted[0].bottom;
  for (let i = 1; i < sorted.length; i++) {
    const b = sorted[i];
    if (b.top < groupEnd) { group.push(b); groupEnd = Math.max(groupEnd, b.bottom); }
    else { clusters.push(group); group = [b]; groupEnd = b.bottom; }
  }
  clusters.push(group);

  const result = new Map<string, { col: number; totalCols: number }>();
  for (const cluster of clusters) {
    if (cluster.length === 1) { result.set(cluster[0].id, { col: 0, totalCols: 1 }); continue; }
    const colEnds: number[] = [];
    const assignments = new Map<string, number>();
    for (const b of cluster) {
      let c = colEnds.findIndex(end => b.top >= end);
      if (c === -1) c = colEnds.length;
      colEnds[c] = b.bottom;
      assignments.set(b.id, c);
    }
    const totalCols = colEnds.length;
    for (const [id, col] of assignments) result.set(id, { col, totalCols });
  }
  return result;
}

function weekdayIdx(date: Date): number {
  const d = date.getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
}

function dayStartMs(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function scheduledLogBadge(log: ScheduledLog): StatusBadge {
  const now = Date.now();
  if (log.status === 'pending_approval') return { label: 'Awaiting approval', bg: 'oklch(0.78 0.168 72 / 0.14)', fg: 'oklch(0.55 0.15 72)' };
  if (log.scheduledFor < now)            return { label: 'Overdue',           bg: 'oklch(0.577 0.245 27 / 0.12)', fg: 'oklch(0.577 0.245 27)' };
  return                                        { label: 'Scheduled',         bg: 'oklch(0.64 0.168 48 / 0.10)', fg: 'oklch(0.64 0.168 48)' };
}

const BLOCK_MIN_HEIGHT = 32; // px — visually equivalent to 30 min

export default function DayTimeline({
  selectedDate, isToday, baseSlots, allBaseSlots, onSaveBaseSlots,
  logs, scheduledLogs, medicalEvents, dogId, onLogDeleted, onScheduledLogDeleted,
  onScheduledLogConfirmed, onMedicalConfirmed,
  onCrossDayDragStart, onCrossDayDragEnd, onPendingBaseSlotClick, trainingSessions = [],
}: DayTimelineProps) {
  const navigate = useNavigate();
  const [timeRange, setTimeRange]       = useState(loadTimeRange);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState(timeRange);
  const [showTopFade, setShowTopFade]   = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(true);
  const [quickAdd, setQuickAdd]         = useState<{ anchorY: number; timeStr: string } | null>(null);
  const [draggingId, setDraggingId]     = useState<string | null>(null);
  const [selectedLog, setSelectedLog]   = useState<LogSelection | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const { startHour, endHour } = timeRange;
  const totalHours  = endHour - startHour;
  const totalHeight = totalHours * PX_PER_HOUR;
  const dayIdx      = weekdayIdx(selectedDate);
  const startMs     = dayStartMs(selectedDate);

  const { slotEvents, standaloneLogs } = useMemo(
    () => matchSlotsToLogs(baseSlots, logs, dayIdx, startMs),
    [baseSlots, logs, dayIdx, startMs],
  );

  // Build the set of walk log IDs that appear on this day (slot-matched or standalone)
  const walkLogIds = useMemo(() => {
    const ids = new Set<string>();
    for (const slot of slotEvents) { if (slot.log) ids.add(slot.log.id); }
    for (const log of standaloneLogs) { ids.add(log.id); }
    return ids;
  }, [slotEvents, standaloneLogs]);

  // Map parentLogId → pee/poop sub-logs; only when the parent exists on this day
  const subLogsByParentId = useMemo(() => {
    const map = new Map<string, RoutineLog[]>();
    for (const log of standaloneLogs) {
      if (log.parentLogId && (log.type === 'pee' || log.type === 'poop') && walkLogIds.has(log.parentLogId)) {
        const arr = map.get(log.parentLogId) ?? [];
        arr.push(log);
        map.set(log.parentLogId, arr);
      }
    }
    return map;
  }, [standaloneLogs, walkLogIds]);

  // Remove pee/poop sub-logs from the displayed standalone list
  const displayedStandaloneLogs = useMemo(() =>
    standaloneLogs.filter(l => !(l.parentLogId && (l.type === 'pee' || l.type === 'poop') && walkLogIds.has(l.parentLogId))),
    [standaloneLogs, walkLogIds],
  );

  function buildSubLogChips(logId: string): SubLogChip[] {
    return (subLogsByParentId.get(logId) ?? []).map(sl => ({
      type: sl.type as 'pee' | 'poop',
      icon: sl.type === 'pee' ? '🌿' : '💩',
    }));
  }

  const columnLayout = useMemo(() => {
    const items: BlockLayoutInfo[] = [];
    for (const slot of slotEvents) {
      const completed = !!slot.log;
      const top = completed
        ? (() => { const d = new Date(slot.log!.timestamp); return minutesToPx(d.getHours() * 60 + d.getMinutes(), startHour); })()
        : minutesToPx(slot.minutesFromMidnight, startHour);
      items.push({ id: slot.slotKey, top, bottom: top + BLOCK_MIN_HEIGHT });
    }
    for (const log of displayedStandaloneLogs) {
      const d = new Date(log.timestamp);
      const top = minutesToPx(d.getHours() * 60 + d.getMinutes(), startHour);
      items.push({ id: log.id, top, bottom: top + BLOCK_MIN_HEIGHT });
    }
    for (const log of scheduledLogs) {
      const d = new Date(log.scheduledFor);
      const top = minutesToPx(d.getHours() * 60 + d.getMinutes(), startHour);
      items.push({ id: log.id, top, bottom: top + BLOCK_MIN_HEIGHT });
    }
    for (const s of trainingSessions) {
      const d = new Date(s.scheduledAt);
      const top = minutesToPx(d.getHours() * 60 + d.getMinutes(), startHour);
      const height = Math.max(40, ((s.durationActualMin ?? 30) / 60) * PX_PER_HOUR);
      items.push({ id: `training-${s.id}`, top, bottom: top + height });
    }
    return computeColumns(items);
  }, [slotEvents, displayedStandaloneLogs, scheduledLogs, startHour]);

  // Scroll to current time on mount (today only)
  useEffect(() => {
    if (!isToday || !scrollRef.current) return;
    const n = new Date();
    const px = minutesToPx(n.getHours() * 60 + n.getMinutes(), startHour);
    scrollRef.current.scrollTop = Math.max(0, px - 100);
  }, [isToday, startHour]);

  // Current time line — updates every minute
  const [nowMin, setNowMin] = useState(() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); });
  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(() => { const n = new Date(); setNowMin(n.getHours() * 60 + n.getMinutes()); }, 60_000);
    return () => clearInterval(id);
  }, [isToday]);

  // Scroll fade detection
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowTopFade(el.scrollTop > 4);
    setShowBottomFade(el.scrollTop < el.scrollHeight - el.clientHeight - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    handleScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const applySettings = () => {
    const next = {
      startHour: Math.max(0, Math.min(settingsDraft.startHour, settingsDraft.endHour - 1)),
      endHour:   Math.min(24, Math.max(settingsDraft.endHour, settingsDraft.startHour + 1)),
    };
    setTimeRange(next);
    saveTimeRange(next);
    setShowSettings(false);
  };

  // Double-click on empty area → open QuickAddPopover
  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-block]')) return;
    const rect = scrollRef.current!.getBoundingClientRect();
    const yInScroll = e.clientY - rect.top + (scrollRef.current?.scrollTop ?? 0);
    setQuickAdd({ anchorY: e.clientY, timeStr: pxToTimeStr(yInScroll, startHour) });
  }, [startHour]);

  // Drag-and-drop
  const handleDragStart = useCallback((
    e: React.DragEvent,
    payload: { kind: 'log' | 'scheduled' | 'base'; id: string; slotKey?: string },
    log?: RoutineLog,
  ) => {
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(payload.id);
    if (payload.kind === 'log' && log && onCrossDayDragStart) {
      const timeOfDayMs = log.timestamp - startMs;
      onCrossDayDragStart(log.id, timeOfDayMs);
    }
  }, [onCrossDayDragStart, startMs]);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    onCrossDayDragEnd?.();
  }, [onCrossDayDragEnd]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggingId(null);
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    const payload = JSON.parse(raw) as { kind: 'log' | 'scheduled' | 'base'; id: string; slotKey?: string };

    const rect = e.currentTarget.getBoundingClientRect();
    const yInScroll = e.clientY - rect.top + (scrollRef.current?.scrollTop ?? 0);
    const newTimeStr = pxToTimeStr(yInScroll, startHour);
    const newMs = startMs + timeStrToMinutes(newTimeStr) * 60_000;

    if (payload.kind === 'log') {
      await updateDoc(doc(db, 'dogs', dogId, 'routines', payload.id), { timestamp: newMs });
    } else if (payload.kind === 'scheduled') {
      await updateDoc(doc(db, 'dogs', dogId, 'scheduledLogs', payload.id), { scheduledFor: newMs });
    } else if (payload.kind === 'base' && payload.slotKey) {
      const type = allBaseSlots[payload.slotKey];
      if (!type) return;
      const updated = { ...allBaseSlots };
      delete updated[payload.slotKey];
      updated[makeSlotKey(dayIdx, newTimeStr)] = type;
      await onSaveBaseSlots(updated);
    }
  }, [startHour, startMs, dayIdx, dogId, allBaseSlots, onSaveBaseSlots]);

  const hours = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i);

  return (
    <div className="flex flex-col flex-1 rounded-2xl border bg-card shadow-sm overflow-hidden min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
        <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
          {isToday ? 'Today' : format(selectedDate, 'EEEE, MMM d')}
        </span>
        <button
          onClick={() => { setSettingsDraft(timeRange); setShowSettings(p => !p); }}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Timeline settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Settings inline panel */}
      {showSettings && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 bg-muted/20 shrink-0">
          <span className="text-xs text-muted-foreground">From</span>
          <input type="number" min={0} max={23} value={settingsDraft.startHour}
            onChange={e => setSettingsDraft(p => ({ ...p, startHour: Number(e.target.value) }))}
            className="w-14 text-xs border border-border/50 rounded-lg px-2 py-1 bg-background outline-none focus:border-primary/50" />
          <span className="text-xs text-muted-foreground">to</span>
          <input type="number" min={1} max={24} value={settingsDraft.endHour}
            onChange={e => setSettingsDraft(p => ({ ...p, endHour: Number(e.target.value) }))}
            className="w-14 text-xs border border-border/50 rounded-lg px-2 py-1 bg-background outline-none focus:border-primary/50" />
          <button onClick={applySettings}
            className="ml-auto px-3 py-1 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: 'oklch(0.64 0.168 48)', color: 'oklch(0.99 0 0)' }}>
            Apply
          </button>
        </div>
      )}

      {/* Medical all-day strip */}
      <AllDayStrip
        events={medicalEvents}
        onEventClick={evt => setSelectedLog({
          kind: 'medical',
          event: evt,
          onConfirm: evt.eventType === 'due' && onMedicalConfirmed
            ? () => onMedicalConfirmed(evt)
            : undefined,
        })}
      />

      {/* Scrollable timeline */}
      <div className="relative flex-1 overflow-hidden min-h-0">
        {showTopFade && (
          <div className="absolute top-0 left-0 right-0 h-8 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, var(--color-card), transparent)' }} />
        )}
        {showBottomFade && (
          <div className="absolute bottom-0 left-0 right-0 h-8 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to top, var(--color-card), transparent)' }} />
        )}

        <div
          ref={scrollRef}
          className="h-full overflow-y-auto"
          onDoubleClick={handleDoubleClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="relative" style={{ height: totalHeight }}>
            {/* Hour grid */}
            {hours.map(hour => {
              const top = (hour - startHour) * PX_PER_HOUR;
              return (
                <div key={hour}>
                  <span
                    className="absolute text-[10px] text-muted-foreground/50 tabular-nums select-none"
                    style={{ top: top - 7, left: 0, width: 44, textAlign: 'right', paddingRight: 6 }}
                  >
                    {String(hour).padStart(2, '0')}:00
                  </span>
                  <div className="absolute left-12 right-0 border-t border-border/30" style={{ top }} />
                  {hour < endHour && (
                    <div className="absolute left-12 right-0 border-t border-border/10"
                      style={{ top: top + PX_PER_HOUR / 2 }} />
                  )}
                </div>
              );
            })}

            {/* Current time indicator */}
            {isToday && nowMin >= startHour * 60 && nowMin <= endHour * 60 && (
              <>
                <span
                  className="absolute text-[9px] font-bold tabular-nums text-red-500 pointer-events-none z-20 select-none"
                  style={{ top: minutesToPx(nowMin, startHour) - 7, left: 0, width: 44, textAlign: 'right', paddingRight: 6 }}
                >
                  {String(Math.floor(nowMin / 60)).padStart(2, '0')}:{String(nowMin % 60).padStart(2, '0')}
                </span>
                <div
                  className="absolute h-px bg-red-500 pointer-events-none z-20"
                  style={{ top: minutesToPx(nowMin, startHour), left: 48, right: 0 }}
                />
              </>
            )}

            {/* Base routine slot blocks */}
            {slotEvents.map(slot => {
              const meta = getRoutineMeta(slot.type);
              const completed = !!slot.log;
              const top = completed
                ? (() => { const d = new Date(slot.log!.timestamp); return minutesToPx(d.getHours() * 60 + d.getMinutes(), startHour); })()
                : minutesToPx(slot.minutesFromMidnight, startHour);
              const { col, totalCols } = columnLayout.get(slot.slotKey) ?? { col: 0, totalCols: 1 };

              return (
                <div key={slot.slotKey} data-block="" style={{ opacity: draggingId === slot.slotKey ? 0.3 : 1 }}>
                  <TimelineBlock
                    kind={completed ? 'base-completed' : 'base-pending'}
                    icon={meta.icon}
                    color={meta.color}
                    label={meta.label}
                    sublabel={completed ? fmtTime(slot.log!.timestamp) : undefined}
                    top={top}
                    height={BLOCK_MIN_HEIGHT}
                    col={col}
                    totalCols={totalCols}
                    subLogs={completed && slot.log ? buildSubLogChips(slot.log.id) : undefined}
                    onClick={completed && slot.log ? () => {
                      const sl = slot.log!;
                      const subs = subLogsByParentId.get(sl.id);
                      setSelectedLog({
                        kind: 'log', log: sl,
                        subLogs: subs,
                        onDelete: () => { subs?.forEach(s => onLogDeleted(s.id)); onLogDeleted(sl.id); },
                      });
                    } : (!completed && onPendingBaseSlotClick ? () => {
                      const d = new Date(selectedDate);
                      const [h, m] = slot.slotTimeStr.split(':').map(Number);
                      d.setHours(h, m, 0, 0);
                      onPendingBaseSlotClick(slot.type, d.getTime());
                    } : undefined)}
                    draggable
                    onDragStart={e => handleDragStart(e, { kind: 'base', id: slot.slotKey, slotKey: slot.slotKey })}
                  />
                </div>
              );
            })}

            {/* Standalone log blocks */}
            {displayedStandaloneLogs.map(log => {
              const meta = getRoutineMeta(log.type, log.customLabel);
              const d    = new Date(log.timestamp);
              const top  = minutesToPx(d.getHours() * 60 + d.getMinutes(), startHour);
              const { col, totalCols } = columnLayout.get(log.id) ?? { col: 0, totalCols: 1 };
              const subs = subLogsByParentId.get(log.id);

              return (
                <div key={log.id} data-block="" style={{ opacity: draggingId === log.id ? 0.3 : 1 }}>
                  <TimelineBlock
                    kind="standalone-log"
                    icon={meta.icon}
                    color={meta.color}
                    label={meta.label}
                    sublabel={fmtTime(log.timestamp)}
                    subLogs={subs ? subs.map(s => ({ type: s.type as 'pee' | 'poop', icon: s.type === 'pee' ? '🌿' : '💩' })) : undefined}
                    top={top}
                    height={BLOCK_MIN_HEIGHT}
                    col={col}
                    totalCols={totalCols}
                    onClick={() => setSelectedLog({
                      kind: 'log', log, subLogs: subs,
                      onDelete: () => { subs?.forEach(s => onLogDeleted(s.id)); onLogDeleted(log.id); },
                    })}
                    draggable
                    onDragStart={e => handleDragStart(e, { kind: 'log', id: log.id }, log)}
                    onDragEnd={handleDragEnd}
                  />
                </div>
              );
            })}

            {/* Scheduled log blocks */}
            {scheduledLogs.map(log => {
              const rt  = ROUTINE_TYPES.find(r => r.type === log.type);
              const d   = new Date(log.scheduledFor);
              const top = minutesToPx(d.getHours() * 60 + d.getMinutes(), startHour);
              const { col, totalCols } = columnLayout.get(log.id) ?? { col: 0, totalCols: 1 };

              return (
                <div key={log.id} data-block="" style={{ opacity: draggingId === log.id ? 0.3 : 1 }}>
                  <TimelineBlock
                    kind="scheduled-log"
                    icon={rt?.icon ?? '📋'}
                    color={rt?.color ?? '#F59E0B'}
                    label={rt?.label ?? log.type}
                    sublabel={log.assignedToName}
                    statusBadge={scheduledLogBadge(log)}
                    top={top}
                    height={BLOCK_MIN_HEIGHT}
                    col={col}
                    totalCols={totalCols}
                    onClick={() => setSelectedLog({
                      kind: 'scheduled',
                      log,
                      onDelete: () => onScheduledLogDeleted(log.id),
                      onConfirm: log.status === 'scheduled' && onScheduledLogConfirmed
                        ? () => onScheduledLogConfirmed(log)
                        : undefined,
                    })}
                    draggable
                    onDragStart={e => handleDragStart(e, { kind: 'scheduled', id: log.id })}
                  />
                </div>
              );
            })}
            {/* Training session blocks */}
            {trainingSessions.map(s => {
              const d = new Date(s.scheduledAt);
              const top = minutesToPx(d.getHours() * 60 + d.getMinutes(), startHour);
              const height = Math.max(40, ((s.durationActualMin ?? 30) / 60) * PX_PER_HOUR);
              const { col, totalCols } = columnLayout.get(`training-${s.id}`) ?? { col: 0, totalCols: 1 };
              return (
                <div key={s.id} data-block="">
                  <TimelineBlock
                    kind="standalone-log"
                    icon="🎯"
                    color="oklch(0.55 0.15 280)"
                    label={s.trainingType.replace(/_/g, ' ')}
                    sublabel={fmtTime(s.scheduledAt)}
                    top={top}
                    height={height}
                    col={col}
                    totalCols={totalCols}
                    onClick={() => navigate(`/training/${s.id}`)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick-add popover (double-click) */}
      {quickAdd && (
        <QuickAddPopover
          anchorY={quickAdd.anchorY}
          clickedTimeStr={quickAdd.timeStr}
          dogId={dogId}
          dayIdx={dayIdx}
          onClose={() => setQuickAdd(null)}
        />
      )}

      <LogDetailSheet selection={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
