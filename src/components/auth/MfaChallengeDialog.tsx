import { useState } from 'react';
import type { MultiFactorError } from 'firebase/auth';
import { useMfa } from '@/hooks/useMfa';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Props {
  error: MultiFactorError | null;
  onResolved: () => void;
  onCancel: () => void;
}

/** Prompts for a TOTP code when sign-in raises a second-factor challenge. */
export default function MfaChallengeDialog({ error, onResolved, onCancel }: Props) {
  const { resolveChallenge } = useMfa();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const handleVerify = async () => {
    if (!error) return;
    setSubmitting(true);
    setErr('');
    try {
      await resolveChallenge(error, code);
      onResolved();
    } catch {
      setErr('Invalid or expired code. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!error} onOpenChange={open => { if (!open) onCancel(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Two-factor verification</DialogTitle>
          <DialogDescription>
            Enter the 6-digit code from your authenticator app to finish signing in.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="mfa-code">Authentication code</Label>
            <Input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
            />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
            <Button onClick={handleVerify} disabled={submitting || code.length < 6}>
              {submitting ? 'Verifying…' : 'Verify'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
