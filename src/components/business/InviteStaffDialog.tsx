import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import type { BusinessRole } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: BusinessRole[];
  onInvite: (email: string, roleId: string) => Promise<{ ok: boolean; reason?: string }>;
}

// Form body — fresh instance each time the dialog opens (state resets on remount).
function InviteForm({ roles, onInvite, onDone }: {
  roles: BusinessRole[];
  onInvite: Props['onInvite'];
  onDone: () => void;
}) {
  const assignableRoles = roles.filter(r => r.id !== 'owner');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState(assignableRoles[0]?.id ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!email.trim() || !roleId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await onInvite(email.trim(), roleId);
      if (res.ok) onDone();
      else setError(res.reason ?? 'Could not invite that user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="invite-email">Email</Label>
          <Input id="invite-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="person@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={roleId} onValueChange={v => setRoleId(v ?? '')}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              {assignableRoles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>Cancel</Button>
        <Button onClick={handleInvite} disabled={saving || !email.trim() || !roleId}>
          {saving ? 'Inviting…' : 'Invite'}
        </Button>
      </DialogFooter>
    </>
  );
}

export default function InviteStaffDialog({ open, onOpenChange, roles, onInvite }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite staff</DialogTitle>
        </DialogHeader>
        {open && <InviteForm roles={roles} onInvite={onInvite} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
