import { useParams, Navigate } from 'react-router-dom';
import { useDog } from '@/contexts/DogContext';
import DogProfileForm from '@/components/dog/DogProfileForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EditDogPage() {
  const { dogId } = useParams<{ dogId: string }>();
  const { dogs } = useDog();
  const dog = dogs.find(d => d.id === dogId);

  if (!dog) return <Navigate to="/" replace />;

  return (
    <div className="max-w-2xl mx-auto pb-[88px] sm:pb-4 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <Card>
        <CardHeader>
          <CardTitle>Edit <span className="capitalize">{dog.name}</span></CardTitle>
        </CardHeader>
        <CardContent>
          <DogProfileForm dogId={dog.id} initial={dog} />
        </CardContent>
      </Card>
    </div>
  );
}
