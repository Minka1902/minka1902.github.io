import { useEffect, useState } from 'react';
import { addDoc, onSnapshot, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { routinesCol } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { dayStart, dayEnd, stripUndefined } from '@/lib/utils';
import type { RoutineLog, RoutineType } from '@/types';

export function useRoutine(dogId: string) {
  const { user } = useAuth();
  const [todayLogs, setTodayLogs] = useState<RoutineLog[]>([]);

  useEffect(() => {
    setTodayLogs([]);
    if (!dogId) return;
    const start = dayStart(Date.now());
    const end = dayEnd(Date.now());
    const q = query(
      routinesCol(dogId),
      where('timestamp', '>=', start),
      where('timestamp', '<=', end),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, snap => {
      setTodayLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as RoutineLog)));
    });
  }, [dogId]);

  const logRoutine = async (type: RoutineType, extras: Partial<RoutineLog> = {}): Promise<string> => {
    const ref = await addDoc(routinesCol(dogId), stripUndefined({
      dogId, type, timestamp: Date.now(),
      loggedBy: user!.uid, loggedByName: user!.displayName,
      source: 'manual', ...extras,
    }));
    return ref.id;
  };

  const deleteLog = async (logId: string) => {
    await deleteDoc(doc(db, 'dogs', dogId, 'routines', logId));
  };

  return { todayLogs, logRoutine, deleteLog };
}

export function useRoutineWindow(dogId: string, startMs: number, endMs: number) {
  const [logs, setLogs] = useState<RoutineLog[]>([]);

  useEffect(() => {
    setLogs([]);
    if (!dogId) return;
    const q = query(
      routinesCol(dogId),
      where('timestamp', '>=', startMs),
      where('timestamp', '<=', endMs),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as RoutineLog)));
    });
  }, [dogId, startMs, endMs]);

  return logs;
}
