import DogProfileForm from '@/components/dog/DogProfileForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreateDogPage() {
  return (
    <div className="max-w-2xl mx-auto pb-[88px] sm:pb-4 lg:flex-1 lg:overflow-y-auto lg:p-4">
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
