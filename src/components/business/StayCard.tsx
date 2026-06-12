import { useState } from 'react';
import { Dog, Globe, Pill, Trash2, User, UtensilsCrossed } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { stayNights } from '@/lib/occupancy';
import type { Stay, StayStatus } from '@/types';

const STATUS_LABELS: Record<StayStatus, string> = {
  requested: 'Requested',
  approved: 'Approved',
  declined: 'Declined',
  checked_in: 'Checked in',
  checked_out: 'Checked out',
  cancelled: 'Cancelled',
};

interface Props {
  stay: Stay;
  canManage: boolean;
  onSetStatus: (status: StayStatus) => Promise<{ ok: boolean; reason?: string }>;
  onAddNote: (text: string) => Promise<void>;
  onDelete: () => void;
}

export default function StayCard({ stay, canManage, onSetStatus, onAddNote, onDelete }: Props) {
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const nights = stayNights(stay.startDate, stay.endDate).length;
  const dayVisit = stay.endDate <= stay.startDate;

  const setStatus = async (status: StayStatus) => {
    setError('');
    const res = await onSetStatus(status);
    if (!res.ok) setError(res.reason ?? 'Could not update the stay.');
  };

  const submitNote = async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await onAddNote(note.trim());
      setNote('');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Dog className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{stay.petName}</span>
              <Badge variant={stay.status === 'checked_in' ? 'default' : 'secondary'}>{STATUS_LABELS[stay.status]}</Badge>
            </div>
            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{stay.customerName}</span>
              <span>{dayVisit ? `${stay.startDate} (day visit)` : `${stay.startDate} → ${stay.endDate} · ${nights} night${nights !== 1 ? 's' : ''}`}</span>
              {stay.source === 'customer' && <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" />Online request</span>}
            </div>
          </div>
          {canManage && (
            <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Delete stay">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {(stay.foodPlan || stay.medications?.length || stay.careInstructions) && (
          <div className="space-y-1 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {stay.foodPlan && (
              <p className="flex items-start gap-1.5">
                <UtensilsCrossed className="mt-0.5 h-3 w-3 shrink-0" />
                <span>
                  {stay.foodPlan.providedBy === 'owner' ? 'Owner brings food' : 'We provide food'}
                  {stay.foodPlan.feedingTimes?.length ? ` · ${stay.foodPlan.feedingTimes.join(', ')}` : ''}
                  {stay.foodPlan.amount ? ` · ${stay.foodPlan.amount}` : ''}
                  {stay.foodPlan.instructions ? ` — ${stay.foodPlan.instructions}` : ''}
                </span>
              </p>
            )}
            {stay.medications?.map((m, i) => (
              <p key={i} className="flex items-start gap-1.5">
                <Pill className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{m.name}{m.dosage ? ` · ${m.dosage}` : ''}{m.schedule ? ` · ${m.schedule}` : ''}</span>
              </p>
            ))}
            {stay.careInstructions && <p>{stay.careInstructions}</p>}
          </div>
        )}

        {stay.dailyNotes && stay.dailyNotes.length > 0 && (
          <div className="space-y-1 text-xs">
            {stay.dailyNotes.slice(-3).map((n, i) => (
              <p key={i} className="text-muted-foreground">
                <span className="font-medium text-foreground">{n.byName}</span>{' '}
                ({new Date(n.at).toLocaleDateString([], { month: 'short', day: 'numeric' })}): {n.text}
              </p>
            ))}
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        {canManage && (
          <div className="flex flex-wrap items-center gap-1.5">
            {stay.status === 'requested' && (
              <>
                <Button size="sm" onClick={() => setStatus('approved')}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => setStatus('declined')}>Decline</Button>
              </>
            )}
            {stay.status === 'approved' && (
              <>
                <Button size="sm" onClick={() => setStatus('checked_in')}>Check in</Button>
                <Button size="sm" variant="outline" onClick={() => setStatus('cancelled')}>Cancel</Button>
              </>
            )}
            {stay.status === 'checked_in' && (
              <Button size="sm" onClick={() => setStatus('checked_out')}>Check out</Button>
            )}
          </div>
        )}

        {canManage && stay.status === 'checked_in' && (
          <div className="flex gap-2">
            <Input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Daily note for the team…"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void submitNote(); } }}
            />
            <Button size="sm" variant="outline" onClick={submitNote} disabled={savingNote || !note.trim()}>
              Add
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
