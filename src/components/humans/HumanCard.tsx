import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import RoleBadge from './RoleBadge';
import type { DogHuman } from '@/types';

interface Props {
  human: DogHuman;
  canRevoke?: boolean;
  onRevoke?: (userId: string) => void;
}

export default function HumanCard({ human, canRevoke, onRevoke }: Props) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
          {human.displayName.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-medium">{human.displayName}</p>
          <p className="text-sm text-muted-foreground">{human.email}</p>
        </div>
        <RoleBadge role={human.role} />
        {canRevoke && onRevoke && (
          <Button variant="ghost" size="sm" onClick={() => onRevoke(human.userId)} className="text-destructive hover:text-destructive">
            Remove
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
