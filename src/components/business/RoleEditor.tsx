import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import CapabilityMatrix from './CapabilityMatrix';
import type { BusinessRole, Capability } from '@/types';

interface Props {
  role?: BusinessRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, capabilities: Capability[]) => Promise<void>;
}

// Form body — fresh instance each open so state initializes from `role`.
function RoleForm({ role, onSave, onDone }: {
  role?: BusinessRole;
  onSave: Props['onSave'];
  onDone: () => void;
}) {
  const readOnly = !!role?.isSystem;
  const [name, setName] = useState(role?.name ?? '');
  const [caps, setCaps] = useState<Capability[]>(role?.capabilities ?? []);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || readOnly) return;
    setSaving(true);
    try {
      await onSave(name.trim(), caps);
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="role-name">Name</Label>
          <Input
            id="role-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Front desk"
            disabled={readOnly}
          />
        </div>
        <CapabilityMatrix value={caps} onChange={setCaps} disabled={readOnly} />
      </div>
      {!readOnly && (
        <DialogFooter>
          <Button variant="outline" onClick={onDone}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      )}
    </>
  );
}

export default function RoleEditor({ role, open, onOpenChange, onSave }: Props) {
  const readOnly = !!role?.isSystem;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? (readOnly ? 'View role' : 'Edit role') : 'New role'}</DialogTitle>
        </DialogHeader>
        {open && <RoleForm role={role} onSave={onSave} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
