import { useEffect, useState } from 'react';
import { addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { medicalCol } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { MEDICAL_CATEGORIES } from '@/lib/constants';
import { stripUndefined } from '@/lib/utils';
import type { MedicalRecord, MedicalCategory } from '@/types';

export function useMedical(dogId: string, category: MedicalCategory) {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);

  useEffect(() => {
    if (!dogId) return;
    const q = query(medicalCol(dogId, category), orderBy('date', 'desc'));
    return onSnapshot(q, snap => {
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() } as MedicalRecord)));
    });
  }, [dogId, category]);

  const addRecord = async (data: Omit<MedicalRecord, 'id'>) => {
    const now = Date.now();
    await addDoc(medicalCol(dogId, category), stripUndefined({
      ...data, dogId, createdBy: user!.uid, createdByName: user!.displayName,
      createdAt: now, updatedAt: now,
    }));
  };

  const updateRecord = async (recordId: string, data: Partial<MedicalRecord>) => {
    const collectionName = MEDICAL_CATEGORIES.find(c => c.category === category)!.collectionName;
    await updateDoc(doc(db, 'dogs', dogId, collectionName, recordId), stripUndefined({ ...data, updatedAt: Date.now() }));
  };

  const deleteRecord = async (recordId: string) => {
    const collectionName = MEDICAL_CATEGORIES.find(c => c.category === category)!.collectionName;
    await deleteDoc(doc(db, 'dogs', dogId, collectionName, recordId));
  };

  return { records, addRecord, updateRecord, deleteRecord };
}

export function useUpcomingDue(dogId: string) {
  const [dueItems, setDueItems] = useState<MedicalRecord[]>([]);
  // useRef to accumulate live snapshots from all 7 categories
  const buckets = useState<Map<string, MedicalRecord[]>>(() => new Map())[0];

  useEffect(() => {
    if (!dogId) return;
    buckets.clear();

    const flush = () => {
      const thirtyDaysFromNow = Date.now() + 30 * 24 * 60 * 60 * 1000;
      const items: MedicalRecord[] = [];
      for (const records of buckets.values()) {
        for (const r of records) {
          // Include overdue + due today + due within 30 days
          if (r.nextDueDate !== undefined && r.nextDueDate <= thirtyDaysFromNow) {
            items.push(r);
          }
        }
      }
      items.sort((a, b) => (a.nextDueDate ?? 0) - (b.nextDueDate ?? 0));
      setDueItems(items);
    };

    const unsubs = MEDICAL_CATEGORIES.map(({ category }) =>
      onSnapshot(
        query(medicalCol(dogId, category), orderBy('date', 'desc')),
        snap => {
          buckets.set(category, snap.docs.map(d => ({ id: d.id, ...d.data() } as MedicalRecord)));
          flush();
        }
      )
    );

    return () => unsubs.forEach(u => u());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dogId]);

  return dueItems;
}
