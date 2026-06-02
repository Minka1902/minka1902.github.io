import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, updateProfile,
  signInWithPopup, GoogleAuthProvider, OAuthProvider,
  type User as FirebaseUser, type UserCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { clearSessionMode } from '@/contexts/SessionModeContext';
import type { UserProfile } from '@/types';

interface AuthContextValue {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        if (snap.exists()) {
          setUser(snap.data() as UserProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { user: fbUser } = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    setFirebaseUser(fbUser);
    const snap = await getDoc(doc(db, 'users', fbUser.uid));
    if (snap.exists()) {
      setUser(snap.data() as UserProfile);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { user: fbUser } = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    await updateProfile(fbUser, { displayName });
    const now = Date.now();
    const profile: UserProfile = { uid: fbUser.uid, email: normalizedEmail, displayName, createdAt: now, updatedAt: now };
    await setDoc(doc(db, 'users', fbUser.uid), profile);
    setUser(profile);
  }, []);

  // Shared handler for OAuth popup providers (Google, Microsoft). Creates the
  // user profile on first sign-in, mirroring email/password registration.
  const handleOAuthResult = useCallback(async ({ user: fbUser }: UserCredential) => {
    setFirebaseUser(fbUser);
    const snap = await getDoc(doc(db, 'users', fbUser.uid));
    if (snap.exists()) {
      setUser(snap.data() as UserProfile);
    } else {
      const now = Date.now();
      const profile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email ?? '',
        displayName: fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'User',
        photoURL: fbUser.photoURL ?? undefined,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(db, 'users', fbUser.uid), profile);
      setUser(profile);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await handleOAuthResult(await signInWithPopup(auth, new GoogleAuthProvider()));
  }, [handleOAuthResult]);

  const loginWithMicrosoft = useCallback(async () => {
    await handleOAuthResult(await signInWithPopup(auth, new OAuthProvider('microsoft.com')));
  }, [handleOAuthResult]);

  const logout = useCallback(async () => {
    await signOut(auth);
    // Reset to personal mode so the next login re-picks identity (full sign-out).
    clearSessionMode();
    setUser(null);
    setFirebaseUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, firebaseUser, loading, login, register, loginWithGoogle, loginWithMicrosoft, logout }),
    [user, firebaseUser, loading, login, register, loginWithGoogle, loginWithMicrosoft, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
