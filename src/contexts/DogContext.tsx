import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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

  // Queries 1 & 2: dogs by mainHumanId and memberUserIds
  useEffect(() => {
    if (!user) {
      setDogs([]);
      setActiveDogState(null);
      setLoading(false);
      return;
    }

    const storedId = localStorage.getItem(ACTIVE_DOG_KEY);
    let mainDogs: Dog[] = [];
    let memberDogs: Dog[] = [];

    const flush = () => {
      setDogs(() => {
        const seen = new Set<string>();
        const combined = [...mainDogs, ...memberDogs].filter(d => {
          if (seen.has(d.id)) return false;
          seen.add(d.id);
          return true;
        });
        setActiveDogState(a => {
          if (a && combined.find(d => d.id === a.id)) return combined.find(d => d.id === a.id)!;
          return combined.find(d => d.id === storedId) ?? combined[0] ?? null;
        });
        return combined;
      });
      setLoading(false);
    };

    const mainUnsub = onSnapshot(
      query(collection(db, 'dogs'), where('mainHumanId', '==', user.uid)),
      snap => {
        mainDogs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Dog));
        flush();
      }
    );

    const memberUnsub = onSnapshot(
      query(collection(db, 'dogs'), where('memberUserIds', 'array-contains', user.uid)),
      snap => {
        memberDogs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Dog));
        flush();
      }
    );

    return () => {
      mainUnsub();
      memberUnsub();
    };
  }, [user]);

  const setActiveDog = useCallback((dog: Dog) => {
    setActiveDogState(dog);
    localStorage.setItem(ACTIVE_DOG_KEY, dog.id);
  }, []);

  const isMainHuman = useCallback(
    (dogId: string) => user ? (dogs.find(d => d.id === dogId)?.mainHumanId === user.uid) : false,
    [user, dogs],
  );

  const value = useMemo(
    () => ({ dogs, activeDog, setActiveDog, isMainHuman, loading }),
    [dogs, activeDog, setActiveDog, isMainHuman, loading],
  );

  return (
    <DogContext.Provider value={value}>
      {children}
    </DogContext.Provider>
  );
}

export function useDog() {
  const ctx = useContext(DogContext);
  if (!ctx) throw new Error('useDog must be used within DogProvider');
  return ctx;
}
