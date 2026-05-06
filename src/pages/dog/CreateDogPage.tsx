import DogProfileForm from '@/components/dog/DogProfileForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreateDogPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add a Dog</CardTitle>
        </CardHeader>
        <CardContent>
          <DogProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}
