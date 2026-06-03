import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { MultiFactorError } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { useSessionMode, type SessionMode } from '@/contexts/SessionModeContext';
import { isMfaRequired } from '@/hooks/useMfa';
import MfaChallengeDialog from '@/components/auth/MfaChallengeDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, PawPrint, Briefcase } from 'lucide-react';

const AUTH_ERRORS: Record<string, string> = {
  'auth/wrong-password':     'Incorrect password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/user-not-found':     'No account with that email.',
  'auth/invalid-email':      'Invalid email address.',
  'auth/too-many-requests':  'Too many attempts. Try again later.',
  'auth/popup-closed-by-user': 'Sign-in window was closed.',
  'auth/cancelled-popup-request': 'Sign-in cancelled.',
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

const homeFor = (mode: SessionMode) => (mode === 'business' ? '/business' : '/');

export default function LoginForm() {
  const { login, loginWithGoogle, loginWithMicrosoft } = useAuth();
  const { mode, setMode } = useSessionMode();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaError, setMfaError] = useState<MultiFactorError | null>(null);

  const goHome = () => navigate(homeFor(mode));
  const handleError = (err: unknown) => {
    // A 2FA-enrolled account raises a second-factor challenge instead of failing.
    if (isMfaRequired(err)) { setMfaError(err); return; }
    const code = (err as { code?: string }).code ?? '';
    setError(AUTH_ERRORS[code] ?? 'Something went wrong. Please try again.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      goHome();
    } catch (err: unknown) {
      handleError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      goHome();
    } catch (err: unknown) {
      handleError(err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleMicrosoft = async () => {
    setError('');
    setMsLoading(true);
    try {
      await loginWithMicrosoft();
      goHome();
    } catch (err: unknown) {
      handleError(err);
    } finally {
      setMsLoading(false);
    }
  };

  const busy = submitting || googleLoading || msLoading;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          {mode === 'business' ? 'Manage your business' : 'Welcome back to PackOps'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Personal vs Business identity */}
        <Tabs value={mode} onValueChange={v => setMode(v as SessionMode)}>
          <TabsList className="w-full">
            <TabsTrigger value="personal" className="flex-1 gap-1.5">
              <PawPrint className="h-3.5 w-3.5" /> Personal
            </TabsTrigger>
            <TabsTrigger value="business" className="flex-1 gap-1.5">
              <Briefcase className="h-3.5 w-3.5" /> Business
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="w-full flex items-center justify-center gap-3 h-10 rounded-lg border border-border bg-background text-sm font-medium transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          {googleLoading ? 'Signing in…' : 'Continue with Google'}
        </button>

        {/* Microsoft — primarily for business accounts */}
        <button
          type="button"
          onClick={handleMicrosoft}
          disabled={busy}
          className="w-full flex items-center justify-center gap-3 h-10 rounded-lg border border-border bg-background text-sm font-medium transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MicrosoftIcon />
          {msLoading ? 'Signing in…' : 'Continue with Microsoft'}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            No account?{' '}
            <Link to="/register" className="underline hover:text-foreground">Register</Link>
          </p>
        </form>
      </CardContent>

      <MfaChallengeDialog
        error={mfaError}
        onResolved={() => { setMfaError(null); goHome(); }}
        onCancel={() => setMfaError(null)}
      />
    </Card>
  );
}
