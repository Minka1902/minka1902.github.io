import { useState } from 'react';
import { useDog } from '@/contexts/DogContext';
import { useMedical, useUpcomingDue } from '@/hooks/useMedical';
import MedicalRecordCard from '@/components/medical/MedicalRecordCard';
import MedicalRecordForm from '@/components/medical/MedicalRecordForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MEDICAL_CATEGORIES } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MedicalCategory } from '@/types';

function CategoryTab({ dogId, category }: { dogId: string; category: MedicalCategory }) {
  const { records, deleteRecord } = useMedical(dogId, category);
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>+ Add</Button>
      </div>
      {records.length === 0
        ? <p className="text-sm text-muted-foreground">No records yet.</p>
        : records.map(r => <MedicalRecordCard key={r.id} record={r} onDelete={deleteRecord} />)
      }
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {MEDICAL_CATEGORIES.find(c => c.category === category)?.label}</DialogTitle>
          </DialogHeader>
          <MedicalRecordForm dogId={dogId} category={category} onSaved={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DueTab({ dogId }: { dogId: string }) {
  const dueItems = useUpcomingDue(dogId);
  if (dueItems.length === 0) return <p className="text-sm text-muted-foreground">Nothing due in the next 30 days.</p>;
  return (
    <div className="space-y-3">
      {dueItems.map(r => <MedicalRecordCard key={r.id} record={r} />)}
    </div>
  );
}

export default function MedicalPage() {
  const { activeDog } = useDog();
  if (!activeDog) return <div className="text-muted-foreground">No active dog selected.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Medical</h1>
      <Tabs defaultValue="vaccination">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="due">Due Soon</TabsTrigger>
          {MEDICAL_CATEGORIES.map(c => (
            <TabsTrigger key={c.category} value={c.category}>{c.label}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="due" className="mt-4">
          <DueTab dogId={activeDog.id} />
        </TabsContent>
        {MEDICAL_CATEGORIES.map(c => (
          <TabsContent key={c.category} value={c.category} className="mt-4">
            <CategoryTab dogId={activeDog.id} category={c.category} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
