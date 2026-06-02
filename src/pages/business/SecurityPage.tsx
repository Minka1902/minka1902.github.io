import { useState } from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { useMfa, isTotpEnabled } from '@/hooks/useMfa';
import TotpEnrollDialog from '@/components/business/TotpEnrollDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SecurityPage() {
  const { enrolledFactors, unenroll } = useMfa();
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [, forceRefresh] = useState(0);
  const factors = enrolledFactors();
  const refresh = () => forceRefresh(n => n + 1);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Security</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {factors.length > 0
              ? <ShieldCheck className="h-4 w-4 text-emerald-600" />
              : <ShieldAlert className="h-4 w-4 text-amber-500" />}
            Two-factor authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isTotpEnabled ? (
            <p className="text-sm text-muted-foreground">
              Two-factor authentication is not enabled for this deployment. It requires the
              project to be upgraded to Google Cloud Identity Platform and{' '}
              <span className="font-mono">VITE_ENABLE_TOTP=true</span>.
            </p>
          ) : factors.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your account is protected with an authenticator app.
              </p>
              {factors.map(f => (
                <div key={f.uid} className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{f.displayName || 'Authenticator app'}</p>
                    <p className="text-xs text-muted-foreground">Enrolled</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => { await unenroll(f.uid); refresh(); }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Add a second layer of protection. You'll enter a code from your authenticator
                app each time you sign in to the business.
              </p>
              <Button onClick={() => setEnrollOpen(true)}>Enable two-factor authentication</Button>
            </>
          )}
        </CardContent>
      </Card>

      <TotpEnrollDialog open={enrollOpen} onOpenChange={setEnrollOpen} onEnrolled={refresh} />
    </div>
  );
}
