import { useState } from 'react';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import DogSearchResult from '@/components/dog/DogSearchResult';
import { Mail, Phone } from 'lucide-react';
import type { Dog, HumanRole } from '@/types';

export default function JoinDogPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Pick<Dog, 'id' | 'name' | 'rescueOrg'>[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = searchTerm.trim();
    if (!raw) return;
    setSearching(true);
    setSearched(false);
    setError('');

    try {
      const usersRef = collection(db, 'users');
      const looksLikeEmail = raw.includes('@');
      const userDocs: { id: string }[] = [];

      if (looksLikeEmail) {
        const emailLower = raw.toLowerCase();
        const snap = await getDocs(query(usersRef, where('email', '==', emailLower)));
        snap.docs.forEach(d => userDocs.push({ id: d.id }));
      } else {
        // Normalize phone: strip spaces, dashes, parens for matching
        const phoneNormalized = raw.replace(/[\s\-()]/g, '');
        const snap = await getDocs(query(usersRef, where('phoneNumber', '==', phoneNormalized)));
        snap.docs.forEach(d => userDocs.push({ id: d.id }));
      }

      if (userDocs.length === 0) {
        setResults([]);
        setSearched(true);
        setSearching(false);
        return;
      }

      const mainHumanIds = [...new Set(userDocs.map(d => d.id))];
      const dogsRef = collection(db, 'dogs');
      const dogSnaps = await Promise.all(
        mainHumanIds.map(uid => getDocs(query(dogsRef, where('mainHumanId', '==', uid))))
      );

      const dogs: Pick<Dog, 'id' | 'name' | 'rescueOrg'>[] = dogSnaps
        .flatMap(s => s.docs)
        .filter(d => (d.data() as Dog).mainHumanId !== user?.uid)
        .map(d => {
          const data = d.data() as Dog;
          return { id: d.id, name: data.name, rescueOrg: data.rescueOrg };
        });

      setResults(dogs);
      setSearched(true);
    } catch (err) {
      console.error('Search failed:', err);
      const code = (err as { code?: string }).code ?? '';
      if (code === 'permission-denied') {
        setError('Search failed: missing permissions. Make sure Firestore rules are deployed (firebase deploy --only firestore:rules).');
      } else {
        setError(`Search failed: ${(err as Error).message ?? 'unknown error'}`);
      }
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = async (dogId: string, role: HumanRole) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'dogs', dogId, 'pendingHumans', user.uid), {
        userId: user.uid,
        displayName: user.displayName,
        email: user.email,
        requestedAt: Date.now(),
        requestedRole: role,
      });
      setJoined(prev => new Set(prev).add(dogId));
    } catch (err) {
      console.error('Join request failed:', err);
      setError(`Couldn't send request: ${(err as Error).message ?? 'unknown error'}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Find a Dog</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search by the main handler's email address or phone number.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search by handler contact</CardTitle>
          <CardDescription className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Email</span>
            <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Phone number</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Email or phone…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
            <Button type="submit" disabled={searching}>
              {searching ? 'Searching…' : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {searched && !error && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          No dogs found. Check the email or phone number and try again.
        </p>
      )}

      <div className="space-y-3">
        {results.map(dog => (
          <DogSearchResult
            key={dog.id}
            dog={dog}
            onJoin={joined.has(dog.id) ? undefined : handleJoin}
            joined={joined.has(dog.id)}
          />
        ))}
      </div>
    </div>
  );
}
