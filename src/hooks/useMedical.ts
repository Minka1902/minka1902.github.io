import { useEffect, useState } from 'react';
import { addDoc, onSnapshot, query, orderBy, where, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { medicalCol } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { MEDICAL_CATEGORIES } from '@/lib/constants';
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
    await addDoc(medicalCol(dogId, category), {
      ...data, dogId, createdBy: user!.uid, createdByName: user!.displayName,
      createdAt: now, updatedAt: now,
    });
  };

  const updateRecord = async (recordId: string, data: Partial<MedicalRecord>) => {
    const collectionName = MEDICAL_CATEGORIES.find(c => c.category === category)!.collectionName;
    await updateDoc(doc(db, 'dogs', dogId, collectionName, recordId), { ...data, updatedAt: Date.now() });
  };

  const deleteRecord = async (recordId: string) => {
    const collectionName = MEDICAL_CATEGORIES.find(c => c.category === category)!.collectionName;
    await deleteDoc(doc(db, 'dogs', dogId, collectionName, recordId));
  };

  return { records, addRecord, updateRecord, deleteRecord };
}

export function useUpcomingDue(dogId: string) {
  const [dueItems, setDueItems] = useState<MedicalRecord[]>([]);

  useEffect(() => {
    if (!dogId) return;
    const thirtyDaysFromNow = Date.now() + 30 * 24 * 60 * 60 * 1000;

    Promise.all(
      MEDICAL_CATEGORIES.map(({ category }) => {
        const q = query(
          medicalCol(dogId, category),
          where('nextDueDate', '<=', thirtyDaysFromNow),
          orderBy('nextDueDate', 'asc')
        );
        return getDocs(q).then(snap =>
          snap.docs.map(d => ({ id: d.id, ...d.data() } as MedicalRecord))
        );
      })
    ).then(results =>
      setDueItems(results.flat().sort((a, b) => (a.nextDueDate ?? 0) - (b.nextDueDate ?? 0)))
    );
  }, [dogId]);

  return dueItems;
}
