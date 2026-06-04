import { useEffect, useState } from 'react';
import { addDoc, getDocs, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { medicalCol } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { MEDICAL_CATEGORIES } from '@/lib/constants';
import { stripUndefined } from '@/lib/utils';
import { isMedicationFinished, type MedicalRecord, type MedicalCategory, type Medication } from '@/types';

export function useMedical(dogId: string, category: MedicalCategory) {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const medCollectionName = MEDICAL_CATEGORIES.find(c => c.category === category)!.collectionName;

  useEffect(() => {
    setRecords([]);
    setLoading(true);
    if (!dogId) { setLoading(false); return; }
    const q = query(medicalCol(dogId, category), orderBy('date', 'desc'));
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as MedicalRecord));
      setRecords(list);
      setLoading(false);
      // Auto-finish: a medication whose course end date has passed is no longer
      // active. Persist the flip so it's reflected everywhere (alerts, timeline).
      if (category === 'medication') {
        for (const r of list) {
          const med = r as Medication;
          if (med.isActive && isMedicationFinished(med)) {
            void updateDoc(doc(db, 'dogs', dogId, medCollectionName, med.id), { isActive: false, updatedAt: Date.now() });
          }
        }
      }
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

  return { records, loading, addRecord, updateRecord, deleteRecord };
}

export interface MedicalCalendarEvent {
  record: MedicalRecord;
  eventType: 'administered' | 'due';
  eventDate: number;
}

// Returns medical events whose administered date OR next-due date falls within the window.
// Uses getDocs (one-shot) instead of onSnapshot — medical records don't change in real-time
// while the user is viewing the timeline, so 7 persistent listeners are unnecessary.
export function useMedicalWindow(dogId: string, startMs: number, endMs: number) {
  const [events, setEvents] = useState<MedicalCalendarEvent[]>([]);

  useEffect(() => {
    if (!dogId) return;
    let cancelled = false;
    setEvents([]);

    Promise.all(
      MEDICAL_CATEGORIES.map(({ category }) =>
        getDocs(query(medicalCol(dogId, category), orderBy('date', 'desc')))
      )
    ).then(snaps => {
      if (cancelled) return;
      const result: MedicalCalendarEvent[] = [];
      for (const snap of snaps) {
        for (const d of snap.docs) {
          const r = { id: d.id, ...d.data() } as MedicalRecord;
          if (r.date >= startMs && r.date <= endMs) {
            result.push({ record: r, eventType: 'administered', eventDate: r.date });
          }
          if (r.nextDueDate && r.nextDueDate >= startMs && r.nextDueDate <= endMs) {
            result.push({ record: r, eventType: 'due', eventDate: r.nextDueDate });
          }
        }
      }
      result.sort((a, b) => a.eventDate - b.eventDate);
      setEvents(result);
    });

    return () => { cancelled = true; };
  }, [dogId, startMs, endMs]);

  return events;
}

export function useActiveMedications(dogId: string) {
  const [medications, setMedications] = useState<Medication[]>([]);

  useEffect(() => {
    if (!dogId) return;
    let cancelled = false;
    setMedications([]);

    getDocs(query(medicalCol(dogId, 'medication'), orderBy('date', 'desc'))).then(snap => {
      if (cancelled) return;
      const active = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Medication))
        .filter(m => m.isActive && !isMedicationFinished(m) && m.administrationTimes && m.administrationTimes.length > 0);
      setMedications(active);
    });

    return () => { cancelled = true; };
  }, [dogId]);

  return medications;
}

export function useUpcomingDue(dogId: string) {
  const [dueItems, setDueItems] = useState<MedicalRecord[]>([]);

  useEffect(() => {
    if (!dogId) return;
    let cancelled = false;
    setDueItems([]);

    const thirtyDaysFromNow = Date.now() + 30 * 24 * 60 * 60 * 1000;

    Promise.all(
      MEDICAL_CATEGORIES.map(({ category }) =>
        getDocs(query(medicalCol(dogId, category), orderBy('date', 'desc')))
      )
    ).then(snaps => {
      if (cancelled) return;
      const items: MedicalRecord[] = [];
      for (const snap of snaps) {
        for (const d of snap.docs) {
          const r = { id: d.id, ...d.data() } as MedicalRecord;
          if (r.nextDueDate !== undefined && r.nextDueDate <= thirtyDaysFromNow) {
            items.push(r);
          }
        }
      }
      items.sort((a, b) => (a.nextDueDate ?? 0) - (b.nextDueDate ?? 0));
      setDueItems(items);
    });

    return () => { cancelled = true; };
  }, [dogId]);

  return dueItems;
}
