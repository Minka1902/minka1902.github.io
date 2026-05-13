import { useState } from 'react';
import { format } from 'date-fns';
import { X, Check, Users } from 'lucide-react';
import { useRoutine } from '@/hooks/useRoutine';
import { useHumans } from '@/hooks/useHumans';
import { useScheduledLogs } from '@/hooks/useScheduledLogs';
import { ROUTINE_TYPES, PEE_COLOR, POOP_COLOR } from '@/lib/constants';
import type { RoutineType } from '@/types';

interface Props {
  dogId: string;
  type: string;
  scheduledMs: number;
  onClose: () => void;
}

function getRoutineMeta(type: string) {
  if (type === 'pee')  return { icon: '🌿', color: PEE_COLOR,  label: 'Pee' };
  if (type === 'poop') return { icon: '💩', color: POOP_COLOR, label: 'Poop' };
  const rt = ROUTINE_TYPES.find(r => r.type === type);
  return { icon: rt?.icon ?? '•', color: rt?.color ?? '#F59E0B', label: rt?.label ?? type };
}

export default function AssignRoutineSheet({ dogId, type, scheduledMs, onClose }: Props) {
  const { logRoutine } = useRoutine(dogId);
  const { humans } = useHumans(dogId);
  const { createScheduledLog } = useScheduledLogs(dogId);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [markingDone, setMarkingDone] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assigned, setAssigned] = useState(false);

  const meta = getRoutineMeta(type);

  const handleMarkDone = async () => {
    setMarkingDone(true);
    await logRoutine(type as RoutineType, { timestamp: scheduledMs });
    setMarkingDone(false);
    onClose();
  };

  const handleAssign = async () => {
    const human = humans.find(h => h.userId === selectedUserId);
    if (!human) return;
    setAssigning(true);
    await createScheduledLog({
      type: type as RoutineType,
      scheduledFor: scheduledMs,
      assignedTo: human.userId,
      assignedToName: human.displayName,
    });
    setAssigning(false);
    setAssigned(true);
    setTimeout(onClose, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: meta.color + '18', border: `1.5px solid ${meta.color}40` }}>
              {meta.icon}
            </div>
            <div>
              <p className="font-semibold text-sm">{meta.label}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(scheduledMs), 'h:mm a')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Mark done now */}
          <button
            onClick={handleMarkDone}
            disabled={markingDone}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ backgroundColor: meta.color + '18', border: `1.5px solid ${meta.color}40`, color: meta.color }}>
            <Check className="h-4 w-4" />
            {markingDone ? 'Logging…' : 'Mark as Done Now'}
          </button>

          {/* Assign to team member */}
          {humans.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or assign to</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {humans.map(h => (
                  <button
                    key={h.userId}
                    onClick={() => setSelectedUserId(prev => prev === h.userId ? '' : h.userId)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all text-left"
                    style={selectedUserId === h.userId ? {
                      borderColor: meta.color + '60',
                      backgroundColor: meta.color + '10',
                    } : undefined}
                  >
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                      {h.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{h.displayName}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{h.role}</p>
                    </div>
                    {selectedUserId === h.userId && (
                      <Check className="h-3.5 w-3.5 shrink-0" style={{ color: meta.color }} />
                    )}
                  </button>
                ))}
              </div>

              {assigned ? (
                <p className="text-xs text-center text-green-600 font-medium py-1">Task assigned!</p>
              ) : (
                <button
                  onClick={handleAssign}
                  disabled={!selectedUserId || assigning}
                  className="w-full py-2 rounded-xl text-sm font-semibold border transition-all disabled:opacity-40"
                  style={selectedUserId ? {
                    backgroundColor: meta.color + '14',
                    borderColor: meta.color + '40',
                    color: meta.color,
                  } : undefined}
                >
                  {assigning ? 'Assigning…' : (
                    <span className="flex items-center justify-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Assign Task
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
