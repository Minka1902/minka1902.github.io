import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useOrg } from '@/contexts/OrgContext';
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
  const { orgIds } = useOrg();
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
      setDogs(prev => {
        const seen = new Set<string>();
        // Keep org dogs from current state, merge with fresh main+member
        const orgDogs = prev.filter(d => d.orgId && !mainDogs.find(m => m.id === d.id) && !memberDogs.find(m => m.id === d.id));
        const combined = [...mainDogs, ...memberDogs, ...orgDogs].filter(d => {
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

  // Query 3: dogs belonging to orgs the user is a member/admin of
  useEffect(() => {
    if (!user || orgIds.length === 0) return;

    // Firestore 'in' supports up to 30 values
    const unsub = onSnapshot(
      query(collection(db, 'dogs'), where('orgId', 'in', orgIds)),
      snap => {
        const orgDogs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Dog));
        setDogs(prev => {
          const seen = new Set<string>();
          const combined = [...prev.filter(d => !d.orgId || orgIds.includes(d.orgId ?? '')), ...orgDogs].filter(d => {
            if (seen.has(d.id)) return false;
            seen.add(d.id);
            return true;
          });
          setActiveDogState(a => {
            if (a && combined.find(d => d.id === a.id)) return combined.find(d => d.id === a.id)!;
            return a;
          });
          return combined;
        });
      }
    );

    return () => unsub();
  }, [user, orgIds]);

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
