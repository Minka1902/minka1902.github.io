import { useState } from 'react';
import { Camera, FileHeart, Plus, Send, Trash2 } from 'lucide-react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { storage } from '@/lib/firebase';
import { useBusiness, useCustomers, useReportCards } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import { todayStr } from '@/lib/occupancy';
import type { ReportCard, ReportCardMood } from '@/types';

const MOODS: { value: ReportCardMood; label: string }[] = [
  { value: 'great', label: 'Great 🎾' },
  { value: 'good', label: 'Good 🙂' },
  { value: 'okay', label: 'Okay 😐' },
  { value: 'stressed', label: 'Stressed 😟' },
];

interface ComposeProps {
  bid: string;
  onSubmit: (data: Omit<ReportCard, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'sentAt'>) => Promise<void>;
  onCancel: () => void;
}

function ReportCardForm({ bid, onSubmit, onCancel }: ComposeProps) {
  const { customers } = useCustomers(bid);
  const [customerId, setCustomerId] = useState('');
  const [petName, setPetName] = useState('');
  const [date, setDate] = useState(todayStr());
  const [mood, setMood] = useState<ReportCardMood>('good');
  const [activities, setActivities] = useState('');
  const [summary, setSummary] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const customer = customers.find(c => c.id === customerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !petName.trim() || !summary.trim()) return;
    setSaving(true);
    try {
      const photoURLs: string[] = [];
      for (const file of photos.slice(0, 5)) {
        const ext = file.name.split('.').pop() ?? 'jpg';
        const snap = await uploadBytes(
          storageRef(storage, `report-cards/${bid}/${Date.now()}_${photoURLs.length}.${ext}`), file);
        photoURLs.push(await getDownloadURL(snap.ref));
      }
      await onSubmit({
        customerId,
        customerUserId: customer.linkedUserId,
        customerName: customer.name,
        petName: petName.trim(),
        date,
        mood,
        activities: activities.split(',').map(a => a.trim()).filter(Boolean),
        summary: summary.trim(),
        photoURLs: photoURLs.length ? photoURLs : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Customer</Label>
          <Select value={customerId} onValueChange={v => setCustomerId(v ?? '')}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Pick a customer" /></SelectTrigger>
            <SelectContent>
              {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rc-pet">Pet name</Label>
          <Input id="rc-pet" value={petName} onChange={e => setPetName(e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="rc-date">Date</Label>
          <Input id="rc-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Mood</Label>
          <Select value={mood} onValueChange={v => setMood(v as ReportCardMood)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MOODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rc-activities">Activities</Label>
        <Input id="rc-activities" value={activities} onChange={e => setActivities(e.target.value)} placeholder="Comma-separated, e.g. group play, nap, walk" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rc-summary">Summary <span className="text-destructive">*</span></Label>
        <Textarea id="rc-summary" value={summary} onChange={e => setSummary(e.target.value)} rows={3} placeholder="How was their day?" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rc-photos" className="flex items-center gap-1.5"><Camera className="h-4 w-4" /> Photos (up to 5)</Label>
        <Input id="rc-photos" type="file" accept="image/*" multiple onChange={e => setPhotos(Array.from(e.target.files ?? []))} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving || !customer || !petName.trim() || !summary.trim()}>
          {saving ? 'Saving…' : 'Save draft'}
        </Button>
      </div>
    </form>
  );
}

export default function ReportCardsPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const { reportCards, loading, createReportCard, sendReportCard, deleteReportCard } = useReportCards(bid);

  const [composeOpen, setComposeOpen] = useState(false);

  const canView = can('view_report_cards');
  const canManage = can('manage_report_cards');

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canView && !canManage) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to report cards.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Report cards</h1>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setComposeOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New report card
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : reportCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileHeart className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No report cards</p>
            <p className="mt-1 text-sm text-muted-foreground">Send pet parents a summary of their dog's visit.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {reportCards.map(card => (
            <Card key={card.id}>
              <CardContent className="space-y-2 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{card.petName}</span>
                      <Badge variant={card.sentAt ? 'secondary' : 'outline'}>{card.sentAt ? 'Sent' : 'Draft'}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {card.customerName} · {card.date}
                      {card.mood ? ` · ${MOODS.find(m => m.value === card.mood)?.label ?? card.mood}` : ''}
                    </p>
                  </div>
                  {canManage && (
                    <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm('Delete this report card?')) void deleteReportCard(card.id); }} aria-label="Delete report card">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{card.summary}</p>
                {card.activities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {card.activities.map(a => (
                      <span key={a} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{a}</span>
                    ))}
                  </div>
                )}
                {card.photoURLs && card.photoURLs.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {card.photoURLs.map(url => (
                      <img key={url} src={url} alt={`${card.petName} report card photo`} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
                {canManage && !card.sentAt && (
                  <Button size="sm" className="gap-1.5" onClick={() => void sendReportCard(card)} disabled={!card.customerUserId}>
                    <Send className="h-3.5 w-3.5" /> {card.customerUserId ? 'Send to pet parent' : 'Customer has no app account'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New report card</DialogTitle></DialogHeader>
          <ReportCardForm
            bid={bid}
            onSubmit={async data => { await createReportCard(data); setComposeOpen(false); }}
            onCancel={() => setComposeOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
