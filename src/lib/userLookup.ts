import { getDocs, query, where } from 'firebase/firestore';
import { usersCol } from '@/lib/firestore';
import type { UserProfile } from '@/types';

export interface LookedUpUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

/**
 * Resolve a registered PackOps user by email. Business customers and staff must
 * both be real app users, so customer/staff flows look users up through here and
 * reject addresses that don't belong to an account.
 */
export async function lookupUserByEmail(email: string): Promise<LookedUpUser | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const snap = await getDocs(query(usersCol(), where('email', '==', normalized)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data() as UserProfile;
  return { uid: d.id, displayName: data.displayName, email: data.email, photoURL: data.photoURL };
}
