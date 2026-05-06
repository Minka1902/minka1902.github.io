import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HUMAN_ROLES } from '@/lib/constants';
import type { Dog, HumanRole } from '@/types';

interface Props {
  dog: Pick<Dog, 'id' | 'name' | 'rescueOrg'>;
  onJoin: (dogId: string, role: HumanRole) => Promise<void>;
}

export default function DogSearchResult({ dog, onJoin }: Props) {
  const [role, setRole] = useState<HumanRole>('caregiver');
  const [joining, setJoining] = useState(false);
  const [sent, setSent] = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    await onJoin(dog.id, role);
    setSent(true);
    setJoining(false);
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex-1">
          <p className="font-semibold">{dog.name}</p>
          {dog.rescueOrg && <p className="text-sm text-muted-foreground">{dog.rescueOrg}</p>}
        </div>
        {sent ? (
          <p className="text-sm text-muted-foreground">Request sent!</p>
        ) : (
          <div className="flex items-center gap-2">
            <Select value={role} onValueChange={v => setRole(v as HumanRole)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {HUMAN_ROLES.map(r => (
                  <SelectItem key={r.role} value={r.role}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleJoin} disabled={joining}>
              {joining ? 'Sending…' : 'Request to Join'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
