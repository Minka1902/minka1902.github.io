import { useState } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DogSearchResult from '@/components/dog/DogSearchResult';
import type { Dog, HumanRole } from '@/types';

export default function JoinDogPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Pick<Dog, 'id' | 'name' | 'rescueOrg'>[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setSearching(true);
    const q = query(collection(db, 'dogs'), where('name', '==', searchTerm.trim()));
    const snap = await getDocs(q);
    setResults(snap.docs.map(d => { const data = d.data() as Dog; return { id: d.id, name: data.name, rescueOrg: data.rescueOrg }; }));
    setSearched(true);
    setSearching(false);
  };

  const handleJoin = async (dogId: string, role: HumanRole) => {
    await addDoc(collection(db, 'dogs', dogId, 'pendingHumans'), {
      userId: user!.uid,
      displayName: user!.displayName,
      email: user!.email,
      requestedAt: Date.now(),
      requestedRole: role,
    });
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Find a Dog to Join</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Dog's name…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Button type="submit" disabled={searching}>
              {searching ? 'Searching…' : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searched && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">No dogs found with that name.</p>
      )}

      <div className="space-y-3">
        {results.map(dog => (
          <DogSearchResult key={dog.id} dog={dog} onJoin={handleJoin} />
        ))}
      </div>
    </div>
  );
}
