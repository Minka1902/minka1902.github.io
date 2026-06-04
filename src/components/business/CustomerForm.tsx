import { useState } from 'react';
import { Check, Search, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { lookupUserByEmail, type LookedUpUser } from '@/lib/userLookup';
import type { BusinessCustomer } from '@/types';

export type CustomerFormData = Omit<BusinessCustomer, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;

interface Props {
  initial?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onCancel: () => void;
}

export default function CustomerForm({ initial, onSubmit, onCancel }: Props) {
  // Customers must be real app users. New customers are resolved by email; an
  // already-linked customer (edit mode) keeps its existing account link.
  const editingLinked = !!initial?.linkedUserId;

  const [email, setEmail] = useState(initial?.email ?? '');
  const [linked, setLinked] = useState<LookedUpUser | null>(
    editingLinked
      ? { uid: initial!.linkedUserId!, displayName: initial?.name ?? '', email: initial?.email ?? '' }
      : null,
  );
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFind = async () => {
    setLooking(true);
    setLookupError(null);
    try {
      const u = await lookupUserByEmail(email);
      if (!u) {
        setLookupError('No PackOps user with that email. Customers must have an account.');
        setLinked(null);
        return;
      }
      setLinked(u);
    } finally {
      setLooking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linked) return;
    setSaving(true);
    try {
      await onSubmit({
        name: linked.displayName || linked.email,
        email: linked.email || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        linkedUserId: linked.uid,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* App-user lookup */}
      <div className="space-y-1.5">
        <Label htmlFor="cust-email">Customer's account email <span className="text-destructive">*</span></Label>
        {editingLinked ? (
          <Input id="cust-email" value={linked?.email ?? ''} disabled />
        ) : (
          <div className="flex gap-2">
            <Input
              id="cust-email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setLinked(null); setLookupError(null); }}
              placeholder="person@example.com"
            />
            <Button type="button" variant="outline" className="gap-1.5 shrink-0" onClick={handleFind} disabled={looking || !email.trim()}>
              <Search className="h-3.5 w-3.5" /> {looking ? 'Finding…' : 'Find'}
            </Button>
          </div>
        )}
        {lookupError && <p className="text-sm text-destructive">{lookupError}</p>}
      </div>

      {linked && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
          {editingLinked ? <UserCheck className="h-4 w-4 text-muted-foreground" /> : <Check className="h-4 w-4 text-emerald-600" />}
          <div className="min-w-0">
            <p className="truncate font-medium">{linked.displayName || linked.email}</p>
            {linked.displayName && <p className="truncate text-xs text-muted-foreground">{linked.email}</p>}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="cust-phone">Phone</Label>
        <Input id="cust-phone" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cust-notes">Notes</Label>
        <Textarea id="cust-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving || !linked}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  );
}
