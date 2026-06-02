import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { TotpSecret } from 'firebase/auth';
import { useMfa } from '@/hooks/useMfa';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnrolled: () => void;
}

/** Enroll a TOTP authenticator app: scan the QR, then confirm a code. */
export default function TotpEnrollDialog({ open, onOpenChange, onEnrolled }: Props) {
  const { startEnrollment, finishEnrollment } = useMfa();
  const [secret, setSecret] = useState<TotpSecret | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Generate the secret as soon as the dialog opens (fresh per open).
  const begin = async () => {
    setErr('');
    setLoading(true);
    try {
      const res = await startEnrollment();
      setSecret(res.secret);
      setQrUrl(res.qrUrl);
      setSecretKey(res.secretKey);
    } catch (e) {
      setErr((e as Error).message ?? 'Could not start enrollment.');
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!secret) return;
    setLoading(true);
    setErr('');
    try {
      await finishEnrollment(secret, code);
      onEnrolled();
      onOpenChange(false);
      reset();
    } catch {
      setErr('Invalid code. Check your authenticator app and try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setSecret(null); setQrUrl(''); setSecretKey(''); setCode(''); setErr(''); };

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        onOpenChange(o);
        if (o && !secret) void begin();
        if (!o) reset();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Set up two-factor authentication</DialogTitle>
          <DialogDescription>
            Scan this QR code with Google Authenticator, Microsoft Authenticator, or any TOTP app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {qrUrl ? (
            <>
              <div className="flex justify-center rounded-lg bg-white p-4">
                <QRCodeSVG value={qrUrl} size={176} />
              </div>
              <p className="text-xs text-muted-foreground text-center break-all">
                Or enter this key manually: <span className="font-mono">{secretKey}</span>
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="totp-code">Enter the 6-digit code</Label>
                <Input
                  id="totp-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              {loading ? 'Generating secret…' : 'Preparing…'}
            </p>
          )}
          {err && <p className="text-sm text-destructive">{err}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button onClick={confirm} disabled={loading || code.length < 6 || !secret}>
              {loading ? 'Verifying…' : 'Enable 2FA'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
