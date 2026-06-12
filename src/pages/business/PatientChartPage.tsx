import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Share2, Stethoscope, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useBusiness, useChartEntries, usePets } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import { todayStr } from '@/lib/occupancy';
import type { ChartEntry, ChartEntryType } from '@/types';

const ENTRY_TYPES: { value: ChartEntryType; label: string }[] = [
  { value: 'visit', label: 'Visit' },
  { value: 'diagnosis', label: 'Diagnosis' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'note', label: 'Note' },
];

const SHAREABLE: ChartEntryType[] = ['vaccination', 'prescription', 'diagnosis'];

export default function PatientChartPage() {
  const { petId } = useParams<{ petId: string }>();
  const { activeBusiness } = useBusiness();
  const { user } = useAuth();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const { pets, loading: petsLoading } = usePets(bid);
  const { entries, loading, createChartEntry, shareChartEntry, deleteChartEntry } = useChartEntries(bid, petId);

  const [addOpen, setAddOpen] = useState(false);
  const [type, setType] = useState<ChartEntryType>('visit');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [date, setDate] = useState(todayStr());
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [shareError, setShareError] = useState('');

  const canView = can('view_patients');
  const canManage = can('manage_patients');
  const pet = pets.find(p => p.id === petId);

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canView && !canManage) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to patient charts.</div>;
  }
  if (!petsLoading && !pet) {
    return (
      <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">
        Patient not found. <Link to="/business/patients" className="underline">Back to patients</Link>
      </div>
    );
  }

  const submit = async () => {
    if (!pet || !title.trim()) return;
    await createChartEntry({
      petId: pet.id,
      petName: pet.name,
      customerId: pet.customerId,
      type,
      title: title.trim(),
      details: details.trim() || undefined,
      date,
      staffName: user?.displayName ?? 'Staff',
      medicationName: medicationName.trim() || undefined,
      dosage: dosage.trim() || undefined,
      batchNumber: batchNumber.trim() || undefined,
    });
    setAddOpen(false);
    setTitle(''); setDetails(''); setMedicationName(''); setDosage(''); setBatchNumber('');
  };

  const share = async (entry: ChartEntry) => {
    setShareError('');
    const res = await shareChartEntry(entry, pet!.linkedDogId!, activeBusiness.name);
    if (!res.ok) setShareError(res.reason ?? 'Could not share the record.');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <Button render={<Link to="/business/patients" />} variant="ghost" size="sm" className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Patients
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{pet?.name ?? '…'}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {pet?.species}{pet?.breed ? ` · ${pet.breed}` : ''}
            {pet?.linkedDogId ? ' · linked to the owner’s PackOps dog' : ''}
          </p>
        </div>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New entry
          </Button>
        )}
      </div>

      {shareError && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{shareError}</p>}

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Stethoscope className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No chart entries yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => (
            <Card key={entry.id}>
              <CardContent className="space-y-1.5 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{entry.title}</span>
                      <Badge variant="secondary">{ENTRY_TYPES.find(t => t.value === entry.type)?.label}</Badge>
                      {entry.sharedMedicalRecordId && <Badge variant="outline">Shared with owner</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {entry.date} · {entry.staffName}
                      {entry.medicationName ? ` · ${entry.medicationName}` : ''}
                      {entry.dosage ? ` · ${entry.dosage}` : ''}
                      {entry.batchNumber ? ` · batch ${entry.batchNumber}` : ''}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 gap-1">
                      {pet?.linkedDogId && SHAREABLE.includes(entry.type) && !entry.sharedMedicalRecordId && (
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => void share(entry)}>
                          <Share2 className="h-3.5 w-3.5" /> Share to owner
                        </Button>
                      )}
                      <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm('Delete this entry?')) void deleteChartEntry(entry.id); }} aria-label="Delete entry">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                {entry.details && <p className="text-sm text-muted-foreground">{entry.details}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New chart entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={v => setType(v as ChartEntryType)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENTRY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="chart-date">Date</Label>
                <Input id="chart-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="chart-title">Title <span className="text-destructive">*</span></Label>
              <Input id="chart-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Rabies booster, Ear infection" required />
            </div>
            {(type === 'prescription' || type === 'vaccination') && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="chart-med">{type === 'vaccination' ? 'Vaccine' : 'Medication'}</Label>
                  <Input id="chart-med" value={medicationName} onChange={e => setMedicationName(e.target.value)} />
                </div>
                {type === 'prescription' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="chart-dosage">Dosage</Label>
                    <Input id="chart-dosage" value={dosage} onChange={e => setDosage(e.target.value)} />
                  </div>
                )}
                {type === 'vaccination' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="chart-batch">Batch no.</Label>
                    <Input id="chart-batch" value={batchNumber} onChange={e => setBatchNumber(e.target.value)} />
                  </div>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="chart-details">Details</Label>
              <Textarea id="chart-details" value={details} onChange={e => setDetails(e.target.value)} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={!title.trim()}>Add entry</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
