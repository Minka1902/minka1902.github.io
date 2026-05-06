import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PublicDogCard } from '@/types';

export default function PublicQRPage() {
  const { dogId } = useParams<{ dogId: string }>();
  const [card, setCard] = useState<PublicDogCard | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!dogId) return;
    getDoc(doc(db, 'publicDogCards', dogId)).then(snap => {
      if (snap.exists()) setCard(snap.data() as PublicDogCard);
      else setNotFound(true);
    });
  }, [dogId]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Dog not found.</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-sm w-full text-center space-y-4">
        {card.photoURL && (
          <img src={card.photoURL} alt={card.name} className="w-32 h-32 rounded-full object-cover mx-auto" />
        )}
        <h1 className="text-3xl font-bold capitalize">{card.name}</h1>
        <p className="text-muted-foreground">If found, please contact:</p>
        <div className="space-y-2 text-sm">
          <p className="font-medium capitalize">{card.mainHumanName}</p>
          {card.phone && <p>{card.phone}</p>}
          {card.address && <p className="text-muted-foreground">{card.address}</p>}
          {card.rescueOrg && <p className="text-muted-foreground">{card.rescueOrg}</p>}
          {card.emergencyContact && (
            <p className="text-muted-foreground">Emergency: {card.emergencyContact}</p>
          )}
        </div>
      </div>
    </div>
  );
}
