import { useEffect, useState } from 'react';
import { addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { scheduledLogsCol } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { stripUndefined } from '@/lib/utils';
import type { ScheduledLog, RoutineType } from '@/types';

export function useScheduledLogs(dogId: string) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ScheduledLog[]>([]);

  useEffect(() => {
    setLogs([]);
    if (!dogId) return;
    const q = query(scheduledLogsCol(dogId), orderBy('scheduledFor', 'asc'));
    return onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduledLog)));
    });
  }, [dogId]);

  const createScheduledLog = async (params: {
    type: RoutineType;
    scheduledFor: number;
    assignedTo: string;
    assignedToName: string;
    reason?: string;
  }) => {
    // Self-assignments are approved immediately; assignments to others need approval
    const isSelf = params.assignedTo === user!.uid;
    await addDoc(scheduledLogsCol(dogId), stripUndefined({
      dogId,
      status: isSelf ? 'scheduled' as const : 'pending_approval' as const,
      createdBy: user!.uid,
      createdByName: user!.displayName,
      createdAt: Date.now(),
      ...params,
    }));
  };

  const approveScheduledLog = async (logId: string) => {
    await updateDoc(doc(db, 'dogs', dogId, 'scheduledLogs', logId), { status: 'scheduled' });
  };

  const declineScheduledLog = async (logId: string) => {
    await updateDoc(doc(db, 'dogs', dogId, 'scheduledLogs', logId), { status: 'declined' });
  };

  const completeScheduledLog = async (logId: string) => {
    await updateDoc(doc(db, 'dogs', dogId, 'scheduledLogs', logId), { status: 'done' });
  };

  const deleteScheduledLog = async (logId: string) => {
    await deleteDoc(doc(db, 'dogs', dogId, 'scheduledLogs', logId));
  };

  return { logs, createScheduledLog, approveScheduledLog, declineScheduledLog, completeScheduledLog, deleteScheduledLog };
}

export function useScheduledLogsWindow(dogId: string, startMs: number, endMs: number) {
  const [logs, setLogs] = useState<ScheduledLog[]>([]);

  useEffect(() => {
    setLogs([]);
    if (!dogId) return;
    // Load all logs and filter client-side — avoids compound index requirement
    const q = query(scheduledLogsCol(dogId), orderBy('scheduledFor', 'asc'));
    return onSnapshot(q, snap => {
      setLogs(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() } as ScheduledLog))
          .filter(l => l.scheduledFor >= startMs && l.scheduledFor <= endMs)
      );
    });
  }, [dogId, startMs, endMs]);

  return logs;
}
