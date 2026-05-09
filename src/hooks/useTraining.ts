import { useEffect, useState } from 'react';
import { addDoc, onSnapshot, query, orderBy, where, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sessionsCol, templatesCol } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { stripUndefined } from '@/lib/utils';
import type { TrainingSession, TrainingTemplate, TrainingType } from '@/types';

export function useTraining(dogId: string) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSessions([]);
    if (!dogId) { setLoading(false); return; }
    setLoading(true);
    const q = query(sessionsCol(dogId), orderBy('scheduledAt', 'desc'));
    return onSnapshot(q, snap => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as TrainingSession)));
      setLoading(false);
    });
  }, [dogId]);

  const getTemplate = async (trainingType: TrainingType): Promise<TrainingTemplate | null> => {
    const q = query(templatesCol(dogId), where('trainingType', '==', trainingType));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as TrainingTemplate;
  };

  const createSession = async (data: Omit<TrainingSession, 'id'>): Promise<string> => {
    const now = Date.now();
    const ref = await addDoc(sessionsCol(dogId), stripUndefined({
      ...data, dogId, trainerId: user!.uid, trainerName: user!.displayName,
      createdAt: now, updatedAt: now,
    }));
    const existing = await getTemplate(data.trainingType);
    if (!existing) {
      const templateRef = doc(db, 'dogs', dogId, 'trainingTemplates', `${dogId}_${data.trainingType}`);
      await setDoc(templateRef, stripUndefined({
        dogId, trainingType: data.trainingType, objective: data.objective,
        setup: data.setup, environment: data.environment, exercises: data.exercises,
        updatedAt: now,
      }));
    }
    return ref.id;
  };

  const updateTemplate = async (templateId: string, data: Partial<TrainingTemplate>) => {
    await setDoc(doc(db, 'dogs', dogId, 'trainingTemplates', templateId), { ...data, updatedAt: Date.now() }, { merge: true });
  };

  const resetTemplate = async (templateId: string) => {
    await deleteDoc(doc(db, 'dogs', dogId, 'trainingTemplates', templateId));
  };

  return { sessions, loading, getTemplate, createSession, updateTemplate, resetTemplate };
}
