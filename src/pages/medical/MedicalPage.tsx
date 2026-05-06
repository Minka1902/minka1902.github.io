import { useState } from 'react';
import { PlusCircle, CalendarClock } from 'lucide-react';
import { useDog } from '@/contexts/DogContext';
import { useMedical, useUpcomingDue } from '@/hooks/useMedical';
import MedicalRecordCard from '@/components/medical/MedicalRecordCard';
import MedicalRecordForm from '@/components/medical/MedicalRecordForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MEDICAL_CATEGORIES } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MedicalCategory } from '@/types';

function CategoryTab({ dogId, category, label }: { dogId: string; category: MedicalCategory; label: string }) {
  const { records, deleteRecord } = useMedical(dogId, category);
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{records.length} record{records.length !== 1 ? 's' : ''}</p>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
          <PlusCircle className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed bg-background gap-3">
          <p className="text-sm text-muted-foreground">No {label.toLowerCase()} records yet.</p>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
            <PlusCircle className="h-3.5 w-3.5" /> Add first record
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(r => <MedicalRecordCard key={r.id} record={r} onDelete={deleteRecord} />)}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {label}</DialogTitle>
          </DialogHeader>
          <MedicalRecordForm dogId={dogId} category={category} onSaved={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DueTab({ dogId }: { dogId: string }) {
  const dueItems = useUpcomingDue(dogId);
  if (dueItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CalendarClock className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div className="text-center">
          <p className="font-medium text-sm">All clear</p>
          <p className="text-sm text-muted-foreground">Nothing due in the next 30 days.</p>
        </div>
      </div>
    );
  }
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
    <div className="max-w-3xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">Medical</h1>
      <Tabs defaultValue="vaccination">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="due" className="gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" /> Due Soon
          </TabsTrigger>
          {MEDICAL_CATEGORIES.map(c => (
            <TabsTrigger key={c.category} value={c.category}>{c.label}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="due" className="mt-5">
          <DueTab dogId={activeDog.id} />
        </TabsContent>
        {MEDICAL_CATEGORIES.map(c => (
          <TabsContent key={c.category} value={c.category} className="mt-5">
            <CategoryTab dogId={activeDog.id} category={c.category} label={c.label} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
