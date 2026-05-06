import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Dog } from '@/types';

interface Props {
  dog: Dog;
  isMain?: boolean;
}

export default function DogCard({ dog, isMain }: Props) {
  const initials = dog.name.slice(0, 2).toUpperCase();

  return (
    <Link to={`/dogs/${dog.id}/edit`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="flex items-center gap-4 p-4">
          {dog.photoURL ? (
            <img src={dog.photoURL} alt={dog.name} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate capitalize">{dog.name}</p>
              {isMain && <Badge variant="outline" className="text-xs">Main</Badge>}
            </div>
            {dog.breed && <p className="text-sm text-muted-foreground truncate">{dog.breed}{dog.isMix ? ' mix' : ''}</p>}
          </div>
          <Badge variant="secondary" className="capitalize">{dog.sex}</Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
