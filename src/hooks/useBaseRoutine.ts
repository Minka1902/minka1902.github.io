import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { RoutineType } from '@/types';

// Slot key format: "{dayIndex}_{HH:mm}"  (dayIndex 0=Mon … 6=Sun)
export type SlotKey = string;
export type BaseRoutineSlots = Record<SlotKey, RoutineType>;

export interface BaseRoutine {
  slots: BaseRoutineSlots;
  updatedAt: number;
}

export function useBaseRoutine(dogId: string) {
  const [slots, setSlots] = useState<BaseRoutineSlots>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSlots({});
    setLoading(true);
    if (!dogId) { setLoading(false); return; }
    const ref = doc(db, 'dogs', dogId, 'settings', 'baseRoutine');
    return onSnapshot(ref, snap => {
      const data = snap.data() as BaseRoutine | undefined;
      setSlots(data?.slots ?? {});
      setLoading(false);
    });
  }, [dogId]);

  const save = async (newSlots: BaseRoutineSlots) => {
    const ref = doc(db, 'dogs', dogId, 'settings', 'baseRoutine');
    await setDoc(ref, { slots: newSlots, updatedAt: Date.now() });
  };

  return { slots, loading, save };
}

export function makeSlotKey(dayIndex: number, timeLabel: string): SlotKey {
  return `${dayIndex}_${timeLabel}`;
}
