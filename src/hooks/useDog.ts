export { useDog } from '@/contexts/DogContext';

import { addDoc, doc, updateDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useDog } from '@/contexts/DogContext';
import { stripUndefined } from '@/lib/utils';
import type { Dog } from '@/types';

export function useDogActions() {
  const { user } = useAuth();
  const { dogs } = useDog();

  const createDog = async (
    data: Omit<Dog, 'id' | 'createdAt' | 'updatedAt' | 'mainHumanId'>
  ): Promise<string> => {
    const now = Date.now();
    const ref = await addDoc(collection(db, 'dogs'), stripUndefined({
      ...data,
      mainHumanId: user!.uid,
      createdAt: now,
      updatedAt: now,
    }));
    return ref.id;
  };

  const updateDog = async (dogId: string, data: Partial<Dog>): Promise<void> => {
    await updateDoc(doc(db, 'dogs', dogId), stripUndefined({ ...data, updatedAt: Date.now() }));
  };

  return { createDog, updateDog, dogs };
}
