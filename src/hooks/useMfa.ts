import {
  multiFactor, getMultiFactorResolver, TotpMultiFactorGenerator,
  type MultiFactorError, type TotpSecret,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * TOTP multi-factor authentication for business accounts.
 *
 * NOTE: Firebase TOTP MFA requires upgrading the project to Google Cloud
 * Identity Platform. Until that's done (and `VITE_ENABLE_TOTP=true`), the UI
 * stays hidden via `isTotpEnabled`. OAuth (Google/Microsoft) works regardless.
 */
export const isTotpEnabled = import.meta.env.VITE_ENABLE_TOTP === 'true';

export function useMfa() {
  /** TOTP factors already enrolled on the current user. */
  const enrolledFactors = () => {
    const user = auth.currentUser;
    if (!user) return [];
    return multiFactor(user).enrolledFactors.filter(
      f => f.factorId === TotpMultiFactorGenerator.FACTOR_ID,
    );
  };

  const isEnrolled = () => enrolledFactors().length > 0;

  /** Begin enrollment: returns the shared secret + an otpauth URL for a QR code. */
  const startEnrollment = async (): Promise<{ secret: TotpSecret; qrUrl: string; secretKey: string }> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in.');
    const session = await multiFactor(user).getSession();
    const secret = await TotpMultiFactorGenerator.generateSecret(session);
    const qrUrl = secret.generateQrCodeUrl(user.email ?? 'account', 'PackOps');
    return { secret, qrUrl, secretKey: secret.secretKey };
  };

  /** Finish enrollment by verifying a code from the authenticator app. */
  const finishEnrollment = async (secret: TotpSecret, code: string, label = 'Authenticator app') => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in.');
    const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code.trim());
    await multiFactor(user).enroll(assertion, label);
  };

  const unenroll = async (factorUid: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in.');
    await multiFactor(user).unenroll(factorUid);
  };

  /**
   * Resolve a second-factor challenge thrown at sign-in
   * (error.code === 'auth/multi-factor-auth-required').
   */
  const resolveChallenge = async (error: MultiFactorError, code: string) => {
    const resolver = getMultiFactorResolver(auth, error);
    const hint = resolver.hints.find(h => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);
    if (!hint) throw new Error('No authenticator-app factor is enrolled on this account.');
    const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code.trim());
    await resolver.resolveSignIn(assertion);
  };

  return { isTotpEnabled, enrolledFactors, isEnrolled, startEnrollment, finishEnrollment, unenroll, resolveChallenge };
}

/** Type guard for the MFA-required error thrown during sign-in. */
export function isMfaRequired(err: unknown): err is MultiFactorError {
  return !!err && typeof err === 'object' && (err as { code?: string }).code === 'auth/multi-factor-auth-required';
}
