import { useEffect, useState } from 'react';
import { onSnapshot, addDoc, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { humansCol, pendingCol } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import type { DogHuman, PendingHuman, HumanRole } from '@/types';

export function useHumans(dogId: string) {
  const [humans, setHumans] = useState<DogHuman[]>([]);

  useEffect(() => {
    if (!dogId) return;
    return onSnapshot(humansCol(dogId), snap => {
      setHumans(snap.docs.map(d => ({ ...d.data(), userId: d.id } as DogHuman)));
    });
  }, [dogId]);

  const revokeHuman = async (userId: string) => {
    await deleteDoc(doc(db, 'dogs', dogId, 'humans', userId));
  };

  return { humans, revokeHuman };
}

export function usePendingHumans(dogId: string) {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingHuman[]>([]);

  useEffect(() => {
    if (!dogId) return;
    return onSnapshot(pendingCol(dogId), snap => {
      setPending(snap.docs.map(d => ({ ...d.data(), userId: d.id } as PendingHuman)));
    });
  }, [dogId]);

  const sendJoinRequest = async (targetDogId: string, role: HumanRole) => {
    await addDoc(pendingCol(targetDogId), {
      userId: user!.uid,
      displayName: user!.displayName,
      email: user!.email,
      requestedAt: Date.now(),
      requestedRole: role,
    });
  };

  const approveHuman = async (userId: string, displayName: string, email: string, role: HumanRole) => {
    const batch = writeBatch(db);
    batch.set(doc(db, 'dogs', dogId, 'humans', userId), {
      userId, displayName, email, role, approvedAt: Date.now(), approvedBy: user!.uid,
    });
    batch.delete(doc(db, 'dogs', dogId, 'pendingHumans', userId));
    await batch.commit();
  };

  const rejectHuman = async (userId: string) => {
    await deleteDoc(doc(db, 'dogs', dogId, 'pendingHumans', userId));
  };

  return { pending, sendJoinRequest, approveHuman, rejectHuman };
}
