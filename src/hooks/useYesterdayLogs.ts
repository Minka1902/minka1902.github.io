import { useEffect, useState } from 'react';
import { onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { routinesCol } from '@/lib/firestore';
import { dayStart, dayEnd } from '@/lib/utils';
import type { RoutineLog } from '@/types';

export function useYesterdayLogs(dogId: string): RoutineLog[] {
  const [logs, setLogs] = useState<RoutineLog[]>([]);

  useEffect(() => {
    if (!dogId) return;
    const yesterday = Date.now() - 86_400_000;
    const start = dayStart(yesterday);
    const end = dayEnd(yesterday);
    const q = query(
      routinesCol(dogId),
      where('timestamp', '>=', start),
      where('timestamp', '<=', end),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as RoutineLog)));
    });
  }, [dogId]);

  return logs;
}
