import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { collection, collectionGroup, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Dog } from '@/types';

const ACTIVE_DOG_KEY = 'packops_active_dog_id';

interface DogContextValue {
  dogs: Dog[];
  activeDog: Dog | null;
  setActiveDog: (dog: Dog) => void;
  isMainHuman: (dogId: string) => boolean;
  loading: boolean;
}

const DogContext = createContext<DogContextValue | null>(null);

export function DogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [activeDog, setActiveDogState] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDogs([]);
      setActiveDogState(null);
      setLoading(false);
      return;
    }

    const mainDogs = new Map<string, Dog>();
    const memberDogs = new Map<string, Dog>();
    const memberDogUnsubs = new Map<string, () => void>();

    const flush = () => {
      const combined = Array.from(new Map([...memberDogs, ...mainDogs]).values());
      setDogs(combined);
      setLoading(false);
      const storedId = localStorage.getItem(ACTIVE_DOG_KEY);
      setActiveDogState(prev => {
        if (prev && combined.find(d => d.id === prev.id)) return combined.find(d => d.id === prev.id)!;
        return combined.find(d => d.id === storedId) ?? combined[0] ?? null;
      });
    };

    // 1. Subscribe to dogs where user is main human
    const mainUnsub = onSnapshot(
      query(collection(db, 'dogs'), where('mainHumanId', '==', user.uid)),
      snap => {
        mainDogs.clear();
        snap.docs.forEach(d => mainDogs.set(d.id, { id: d.id, ...d.data() } as Dog));
        flush();
      }
    );

    // 2. Subscribe to all humans/* subcollection entries where userId == user.uid
    //    This fires whenever a main human approves this user for a dog.
    const memberUnsub = onSnapshot(
      query(collectionGroup(db, 'humans'), where('userId', '==', user.uid)),
      snap => {
        const newIds = new Set(
          snap.docs.map(d => d.ref.parent.parent?.id).filter(Boolean) as string[]
        );

        // Remove stale subscriptions
        for (const [id, unsub] of memberDogUnsubs) {
          if (!newIds.has(id)) {
            unsub();
            memberDogUnsubs.delete(id);
            memberDogs.delete(id);
          }
        }

        // Add new dog subscriptions
        for (const dogId of newIds) {
          if (!memberDogUnsubs.has(dogId)) {
            const dogUnsub = onSnapshot(doc(db, 'dogs', dogId), dogSnap => {
              if (dogSnap.exists()) {
                memberDogs.set(dogId, { id: dogId, ...dogSnap.data() } as Dog);
              } else {
                memberDogs.delete(dogId);
              }
              flush();
            });
            memberDogUnsubs.set(dogId, dogUnsub);
          }
        }

        flush();
      }
    );

    return () => {
      mainUnsub();
      memberUnsub();
      memberDogUnsubs.forEach(unsub => unsub());
    };
  }, [user]);

  const setActiveDog = (dog: Dog) => {
    setActiveDogState(dog);
    localStorage.setItem(ACTIVE_DOG_KEY, dog.id);
  };

  const isMainHuman = (dogId: string) =>
    user ? (dogs.find(d => d.id === dogId)?.mainHumanId === user.uid) : false;

  return (
    <DogContext.Provider value={{ dogs, activeDog, setActiveDog, isMainHuman, loading }}>
      {children}
    </DogContext.Provider>
  );
}

export function useDog() {
  const ctx = useContext(DogContext);
  if (!ctx) throw new Error('useDog must be used within DogProvider');
  return ctx;
}
