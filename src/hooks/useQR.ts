import { useEffect, useState } from 'react';
import { onSnapshot, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Dog, QRVisibilityConfig, PublicDogCard } from '@/types';

export function useQR(dogId: string) {
  const { user } = useAuth();
  const [dog, setDog] = useState<Dog | null>(null);

  useEffect(() => {
    if (!dogId) return;
    return onSnapshot(doc(db, 'dogs', dogId), snap => {
      if (snap.exists()) setDog({ id: snap.id, ...snap.data() } as Dog);
    });
  }, [dogId]);

  const updateQRVisibility = async (config: QRVisibilityConfig) => {
    await updateDoc(doc(db, 'dogs', dogId), { qrVisibility: config, updatedAt: Date.now() });
    const snap = await getDoc(doc(db, 'dogs', dogId));
    const dogData = snap.data() as Dog;
    const card: PublicDogCard = {
      dogId,
      name: dogData.name,
      mainHumanName: user!.displayName,
      phone: config.showPhone ? (user!.phoneNumber ?? undefined) : undefined,
      address: config.showAddress ? dogData.homeAddress?.address : undefined,
      rescueOrg: config.showRescueOrg ? dogData.rescueOrg : undefined,
      emergencyContact: dogData.emergencyContact
        ? `${dogData.emergencyContact.name}${dogData.emergencyContact.phone ? ` · ${dogData.emergencyContact.countryCode}${dogData.emergencyContact.phone}` : ''}`
        : undefined,
    };
    await setDoc(doc(db, 'publicDogCards', dogId), card);
  };

  const toggleQRPublic = async (isPublic: boolean) => {
    await updateDoc(doc(db, 'dogs', dogId), { qrPublic: isPublic, updatedAt: Date.now() });
  };

  return { dog, updateQRVisibility, toggleQRPublic };
}
