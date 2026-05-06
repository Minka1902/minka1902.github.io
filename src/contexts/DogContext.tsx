import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
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

    const q = query(collection(db, 'dogs'), where('mainHumanId', '==', user.uid));
    const unsub = onSnapshot(q, snap => {
      const loadedDogs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Dog));
      setDogs(loadedDogs);
      setLoading(false);

      const storedId = localStorage.getItem(ACTIVE_DOG_KEY);
      const restored = loadedDogs.find(d => d.id === storedId) ?? loadedDogs[0] ?? null;
      setActiveDogState(prev => {
        // Keep current active dog if it's still in the list (avoids resetting on re-renders)
        if (prev && loadedDogs.find(d => d.id === prev.id)) return prev;
        return restored;
      });
    });
    return unsub;
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
