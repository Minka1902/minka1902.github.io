import { format } from 'date-fns';
import {
  User, Clock, Smartphone, PenLine, Footprints, Moon, Utensils, Droplets,
  CalendarClock, CheckCircle2, AlertCircle, Timer, Trash2, CheckCheck, Calendar,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ROUTINE_TYPES, PEE_COLOR, POOP_COLOR, MEDICAL_CATEGORY_META, MEDICAL_CATEGORIES } from '@/lib/constants';
import type { RoutineLog, ScheduledLog } from '@/types';
import type { MedicalCalendarEvent } from '@/hooks/useMedical';

export type LogSelection =
  | { kind: 'log';       log: RoutineLog;            subLogs?: RoutineLog[]; onDelete?: () => void }
  | { kind: 'scheduled'; log: ScheduledLog;           onDelete?: () => void; onConfirm?: () => void }
  | { kind: 'medical';   event: MedicalCalendarEvent; onConfirm?: () => void };

interface Props {
  selection: LogSelection | null;
  onClose: () => void;
}

function getTypeMeta(type: string) {
  if (type === 'pee')  return { icon: '🌿', color: PEE_COLOR,  label: 'Pee' };
  if (type === 'poop') return { icon: '💩', color: POOP_COLOR, label: 'Poop' };
  const rt = ROUTINE_TYPES.find(r => r.type === type);
  return { icon: rt?.icon ?? '•', color: rt?.color ?? '#F59E0B', label: rt?.label ?? type };
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
      <div className="shrink-0 mt-0.5 text-muted-foreground/60">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 leading-none mb-0.5">{label}</p>
        <p className="text-sm text-foreground leading-snug">{value}</p>
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  pending_approval: { bg: 'oklch(0.78 0.168 72 / 0.14)', fg: 'oklch(0.55 0.15 72)',    label: 'Awaiting approval' },
  scheduled:        { bg: 'oklch(0.64 0.168 48 / 0.10)', fg: 'oklch(0.64 0.168 48)',   label: 'Scheduled' },
  done:             { bg: 'oklch(0.72 0.19 145 / 0.12)', fg: 'oklch(0.52 0.19 145)',   label: 'Done' },
  skipped:          { bg: 'oklch(0.6 0.05 240 / 0.10)',  fg: 'oklch(0.55 0.05 240)',   label: 'Skipped' },
  declined:         { bg: 'oklch(0.577 0.245 27 / 0.12)', fg: 'oklch(0.577 0.245 27)', label: 'Declined' },
};

export default function LogDetailSheet({ selection, onClose }: Props) {
  const open = selection !== null;

  const handleDelete = () => { selection?.onDelete?.(); onClose(); };
  const handleConfirm = () => { selection?.onConfirm?.(); onClose(); };

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80dvh] overflow-y-auto pb-safe">
        {selection && (
          <>
            {selection.kind === 'log'       && <LogContent log={selection.log} subLogs={selection.subLogs} />}
            {selection.kind === 'scheduled' && <ScheduledContent log={selection.log} />}
            {selection.kind === 'medical'   && <MedicalContent event={selection.event} />}

            {/* Action buttons */}
            {'onConfirm' in selection && selection.onConfirm && (
              <div className="px-4 pt-1 pb-3">
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-2 w-full justify-center rounded-xl py-2.5 text-sm font-semibold transition-colors"
                  style={{ backgroundColor: 'oklch(0.72 0.19 145 / 0.14)', color: 'oklch(0.42 0.19 145)' }}
                >
                  <CheckCheck className="h-4 w-4" />
                  {selection.kind === 'medical' ? 'Confirm done today' : 'Mark as done'}
                </button>
              </div>
            )}
            {'onDelete' in selection && selection.onDelete && (
              <div className={`px-4 pb-6 ${'onConfirm' in selection && selection.onConfirm ? 'pt-0' : 'pt-2'}`}>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full justify-center rounded-xl py-2.5 text-sm font-medium text-destructive border border-destructive/20 hover:bg-destructive/8 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete log
                </button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function LogContent({ log, subLogs }: { log: RoutineLog; subLogs?: RoutineLog[] }) {
  const meta = getTypeMeta(log.type);
  const label = log.type === 'custom' && log.customLabel ? log.customLabel : meta.label;

  return (
    <>
      <SheetHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: meta.color + '20' }}>
            {meta.icon}
          </div>
          <div>
            <SheetTitle>{label}</SheetTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Activity log</p>
          </div>
        </div>
      </SheetHeader>
      <div className="px-4 pb-4">
        <Row icon={Clock}    label="Time"      value={format(new Date(log.timestamp), 'EEEE, MMM d · h:mm a')} />
        <Row icon={User}     label="Logged by" value={log.loggedByName} />
        <Row icon={log.source === 'device' ? Smartphone : PenLine} label="Source" value={log.source === 'device' ? 'Device' : 'Manual entry'} />
        {log.type === 'walk' && (
          <>
            {log.walkDurationMin  !== undefined && <Row icon={Timer}     label="Duration" value={`${log.walkDurationMin} min`} />}
            {log.walkDistanceKm   !== undefined && <Row icon={Footprints} label="Distance" value={`${log.walkDistanceKm.toFixed(2)} km`} />}
            {log.walkAvgSpeedKmh  !== undefined && <Row icon={Footprints} label="Avg speed" value={`${log.walkAvgSpeedKmh.toFixed(1)} km/h`} />}
          </>
        )}
        {log.type === 'sleep' && log.sleepDurationMin !== undefined && (
          <Row icon={Moon} label="Duration" value={`${log.sleepDurationMin} min`} />
        )}
        {log.type === 'eat' && (
          <>
            {log.foodType         && <Row icon={Utensils} label="Food type" value={log.foodType} />}
            {log.foodAmountGrams  !== undefined && <Row icon={Utensils} label="Amount" value={`${log.foodAmountGrams} g`} />}
          </>
        )}
        {log.type === 'drink' && log.waterAmountMl !== undefined && (
          <Row icon={Droplets} label="Water" value={`${log.waterAmountMl} ml`} />
        )}
        {log.notes && <Row icon={PenLine} label="Notes" value={log.notes} />}
        {subLogs && subLogs.length > 0 && (
          <div className="flex items-center gap-2 py-2.5 border-b border-border/40 last:border-0">
            <div className="shrink-0 mt-0.5 text-muted-foreground/60">
              <PenLine className="h-3.5 w-3.5 opacity-0" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 leading-none mb-1.5">During this walk</p>
              <div className="flex gap-2">
                {subLogs.map(sl => (
                  <span key={sl.id} className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: sl.type === 'pee' ? '#84CC1620' : '#A78BFA20', color: sl.type === 'pee' ? '#84CC16' : '#A78BFA' }}>
                    {sl.type === 'pee' ? '🌿' : '💩'} {sl.type === 'pee' ? 'Peed' : 'Pooped'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ScheduledContent({ log }: { log: ScheduledLog }) {
  const meta = getTypeMeta(log.type);
  const status = STATUS_STYLES[log.status] ?? STATUS_STYLES.scheduled;
  const isOverdue = log.status === 'scheduled' && log.scheduledFor < Date.now();

  return (
    <>
      <SheetHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: meta.color + '20' }}>
            {meta.icon}
          </div>
          <div className="flex-1 min-w-0">
            <SheetTitle>{meta.label}</SheetTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Scheduled task</p>
          </div>
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0"
            style={{ backgroundColor: isOverdue ? 'oklch(0.577 0.245 27 / 0.12)' : status.bg, color: isOverdue ? 'oklch(0.577 0.245 27)' : status.fg }}
          >
            {isOverdue ? 'Overdue' : status.label}
          </span>
        </div>
      </SheetHeader>
      <div className="px-4 pb-4">
        <Row icon={CalendarClock} label="Scheduled for" value={format(new Date(log.scheduledFor), 'EEEE, MMM d · h:mm a')} />
        <Row icon={User}          label="Assigned to"   value={log.assignedToName} />
        <Row icon={log.status === 'done' ? CheckCircle2 : AlertCircle} label="Created by" value={log.createdByName} />
        {log.reason && <Row icon={PenLine} label="Reason" value={log.reason} />}
        <Row icon={Clock} label="Created" value={format(new Date(log.createdAt), 'MMM d, yyyy · h:mm a')} />
      </div>
    </>
  );
}

function MedicalContent({ event }: { event: MedicalCalendarEvent }) {
  const { record, eventType, eventDate } = event;
  const meta = MEDICAL_CATEGORY_META[record.category] ?? { icon: '🏥', color: '#6366F1' };
  const catLabel = MEDICAL_CATEGORIES.find(c => c.category === record.category)?.label ?? record.category;

  const specificField = (() => {
    if (record.category === 'vaccination')  return (record as import('@/types').Vaccination).vaccineName;
    if (record.category === 'medication')   return (record as import('@/types').Medication).medicationName;
    if (record.category === 'flea_tick')    return (record as import('@/types').FleaTick).productName;
    if (record.category === 'deworming')    return (record as import('@/types').Deworming).productName;
    if (record.category === 'allergy')      return (record as import('@/types').Allergy).allergen;
    if (record.category === 'diagnosis')    return (record as import('@/types').Diagnosis).condition;
    if (record.category === 'surgery')      return (record as import('@/types').Surgery).procedure;
    return undefined;
  })();

  return (
    <>
      <SheetHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: meta.color + '20' }}>
            {meta.icon}
          </div>
          <div className="flex-1 min-w-0">
            <SheetTitle>{record.title}</SheetTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{catLabel}</p>
          </div>
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0"
            style={
              eventType === 'due'
                ? { backgroundColor: 'oklch(0.577 0.245 27 / 0.12)', color: 'oklch(0.577 0.245 27)' }
                : { backgroundColor: 'oklch(0.72 0.19 145 / 0.12)', color: 'oklch(0.42 0.19 145)' }
            }
          >
            {eventType === 'due' ? 'Due' : 'Administered'}
          </span>
        </div>
      </SheetHeader>
      <div className="px-4 pb-4">
        <Row icon={Calendar} label={eventType === 'due' ? 'Due date' : 'Date'} value={format(new Date(eventDate), 'EEEE, MMM d, yyyy')} />
        {specificField && <Row icon={PenLine} label="Details" value={specificField} />}
        {record.category === 'medication' && (record as import('@/types').Medication).dosage && (
          <Row icon={Droplets} label="Dosage" value={(record as import('@/types').Medication).dosage!} />
        )}
        {record.category === 'medication' && (record as import('@/types').Medication).frequency && (
          <Row icon={Clock} label="Frequency" value={(record as import('@/types').Medication).frequency!} />
        )}
        {record.category === 'allergy' && (record as import('@/types').Allergy).severity && (
          <Row icon={AlertCircle} label="Severity" value={(record as import('@/types').Allergy).severity!} />
        )}
        {record.provider && <Row icon={User} label="Provider" value={record.provider} />}
        {record.nextDueDate && <Row icon={CalendarClock} label="Next due" value={format(new Date(record.nextDueDate), 'MMM d, yyyy')} />}
        {record.notes && <Row icon={PenLine} label="Notes" value={record.notes} />}
        <Row icon={User} label="Recorded by" value={record.createdByName} />
      </div>
    </>
  );
}
