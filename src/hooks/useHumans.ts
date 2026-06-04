import { useEffect, useState } from 'react';
import { onSnapshot, setDoc, doc, writeBatch, deleteDoc, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { humansCol, pendingCol } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { stripUndefined } from '@/lib/utils';
import type { DogHuman, PendingHuman, HumanRole, BusinessType } from '@/types';

// Map a service business to the closest care-team role.
function roleForBusiness(type: BusinessType): HumanRole {
  if (type === 'dog_walker') return 'walker';
  if (type === 'trainer') return 'trainer';
  return 'caregiver';
}

export function useHumans(dogId: string) {
  const { user } = useAuth();
  const [humans, setHumans] = useState<DogHuman[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHumans([]);
    setLoading(true);
    if (!dogId) { setLoading(false); return; }
    return onSnapshot(humansCol(dogId), snap => {
      setHumans(snap.docs.map(d => ({ ...d.data(), userId: d.id } as DogHuman)));
      setLoading(false);
    });
  }, [dogId]);

  const revokeHuman = async (userId: string) => {
    await deleteDoc(doc(db, 'dogs', dogId, 'humans', userId));
    // Best-effort: remove from memberUserIds (non-fatal if it fails)
    await updateDoc(doc(db, 'dogs', dogId), { memberUserIds: arrayRemove(userId) }).catch(console.error);
  };

  // Add a service business (dog walker, vet, …) to the dog's care team. Stored in
  // the same humans subcollection under a synthetic `biz_<id>` id.
  const addBusinessToTeam = async (biz: { id: string; name: string; type: BusinessType }) => {
    const id = `biz_${biz.id}`;
    await setDoc(doc(db, 'dogs', dogId, 'humans', id), stripUndefined({
      userId: id,
      displayName: biz.name,
      email: '',
      role: roleForBusiness(biz.type),
      isBusiness: true,
      businessId: biz.id,
      businessType: biz.type,
      approvedAt: Date.now(),
      approvedBy: user!.uid,
    } as DogHuman));
  };

  return { humans, loading, revokeHuman, addBusinessToTeam };
}

export function usePendingHumans(dogId: string) {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingHuman[]>([]);

  useEffect(() => {
    setPending([]);
    if (!dogId) return;
    return onSnapshot(pendingCol(dogId), snap => {
      setPending(snap.docs.map(d => ({ ...d.data(), userId: d.id } as PendingHuman)));
    });
  }, [dogId]);

  const sendJoinRequest = async (targetDogId: string, role: HumanRole) => {
    await setDoc(doc(db, 'dogs', targetDogId, 'pendingHumans', user!.uid), {
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
    // Write memberUserIds separately with merge so it works even if the field never existed
    await setDoc(doc(db, 'dogs', dogId), { memberUserIds: arrayUnion(userId) }, { merge: true });
  };

  const addHumanDirectly = async (userId: string, displayName: string, email: string, role: HumanRole) => {
    await setDoc(doc(db, 'dogs', dogId, 'humans', userId), {
      userId, displayName, email, role, approvedAt: Date.now(), approvedBy: user!.uid,
    });
    // Use setDoc + merge so memberUserIds is created even if it doesn't exist yet
    await setDoc(doc(db, 'dogs', dogId), { memberUserIds: arrayUnion(userId) }, { merge: true });
  };

  const rejectHuman = async (userId: string) => {
    await deleteDoc(doc(db, 'dogs', dogId, 'pendingHumans', userId));
  };

  return { pending, sendJoinRequest, approveHuman, rejectHuman, addHumanDirectly };
}
