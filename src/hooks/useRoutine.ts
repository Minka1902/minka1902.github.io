import { useEffect, useState } from 'react';
import { addDoc, onSnapshot, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { routinesCol } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { dayStart, dayEnd } from '@/lib/utils';
import type { RoutineLog, RoutineType } from '@/types';

export function useRoutine(dogId: string) {
  const { user } = useAuth();
  const [todayLogs, setTodayLogs] = useState<RoutineLog[]>([]);

  useEffect(() => {
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

  const logRoutine = async (type: RoutineType, extras: Partial<RoutineLog> = {}) => {
    await addDoc(routinesCol(dogId), {
      dogId, type, timestamp: Date.now(),
      loggedBy: user!.uid, loggedByName: user!.displayName,
      source: 'manual', ...extras,
    });
  };

  const deleteLog = async (logId: string) => {
    await deleteDoc(doc(db, 'dogs', dogId, 'routines', logId));
  };

  return { todayLogs, logRoutine, deleteLog };
}
