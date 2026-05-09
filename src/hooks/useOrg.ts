import { useEffect, useState } from 'react';
import {
  addDoc, doc, updateDoc, deleteDoc, setDoc, writeBatch,
  onSnapshot, arrayUnion, arrayRemove, getDocs, query, where, getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { orgsCol, orgMembersCol, orgPendingCol } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { stripUndefined } from '@/lib/utils';
import type { Organization, OrgMember, PendingOrgMember } from '@/types';

export { useOrg } from '@/contexts/OrgContext';

// ─── Read hooks ────────────────────────────────────────────────────────────────

export function useOrgMembers(orgId: string) {
  const [members, setMembers] = useState<OrgMember[]>([]);

  useEffect(() => {
    setMembers([]);
    if (!orgId) return;
    return onSnapshot(orgMembersCol(orgId), snap => {
      setMembers(snap.docs.map(d => ({ ...d.data(), userId: d.id } as OrgMember)));
    });
  }, [orgId]);

  return { members };
}

export function useOrgPendingMembers(orgId: string) {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingOrgMember[]>([]);

  useEffect(() => {
    setPending([]);
    if (!orgId) return;
    return onSnapshot(orgPendingCol(orgId), snap => {
      setPending(snap.docs.map(d => ({ ...d.data(), userId: d.id } as PendingOrgMember)));
    });
  }, [orgId]);

  const requestJoin = async (targetOrgId: string) => {
    await setDoc(doc(db, 'organizations', targetOrgId, 'pendingMembers', user!.uid), {
      userId: user!.uid,
      displayName: user!.displayName,
      email: user!.email,
      requestedAt: Date.now(),
    });
  };

  const approveMember = async (userId: string, displayName: string, email: string) => {
    const batch = writeBatch(db);
    batch.set(doc(db, 'organizations', orgId, 'members', userId), {
      userId,
      displayName,
      email,
      role: 'member',
      joinedAt: Date.now(),
      invitedBy: user!.uid,
    });
    batch.delete(doc(db, 'organizations', orgId, 'pendingMembers', userId));
    await batch.commit();
    await updateDoc(doc(db, 'organizations', orgId), {
      memberUserIds: arrayUnion(userId),
      updatedAt: Date.now(),
    });
  };

  const rejectMember = async (userId: string) => {
    await deleteDoc(doc(db, 'organizations', orgId, 'pendingMembers', userId));
  };

  return { pending, requestJoin, approveMember, rejectMember };
}

// ─── Action hooks ──────────────────────────────────────────────────────────────

export function useOrgActions(orgId: string) {
  const { user } = useAuth();

  const updateOrg = async (data: Partial<Omit<Organization, 'id' | 'createdAt' | 'createdBy'>>) => {
    await updateDoc(doc(db, 'organizations', orgId), stripUndefined({ ...data, updatedAt: Date.now() }));
  };

  const inviteMember = async (userId: string, displayName: string, email: string) => {
    // Admin directly adds the user without a pending request
    const batch = writeBatch(db);
    batch.set(doc(db, 'organizations', orgId, 'members', userId), {
      userId,
      displayName,
      email,
      role: 'member',
      joinedAt: Date.now(),
      invitedBy: user!.uid,
    });
    await batch.commit();
    await updateDoc(doc(db, 'organizations', orgId), {
      memberUserIds: arrayUnion(userId),
      updatedAt: Date.now(),
    });
  };

  const removeMember = async (userId: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'organizations', orgId, 'members', userId));
    await batch.commit();
    await updateDoc(doc(db, 'organizations', orgId), {
      memberUserIds: arrayRemove(userId),
      adminUserIds: arrayRemove(userId),
      updatedAt: Date.now(),
    });
  };

  const promoteToAdmin = async (userId: string) => {
    const batch = writeBatch(db);
    batch.update(doc(db, 'organizations', orgId, 'members', userId), { role: 'admin' });
    await batch.commit();
    await updateDoc(doc(db, 'organizations', orgId), {
      adminUserIds: arrayUnion(userId),
      memberUserIds: arrayRemove(userId),
      updatedAt: Date.now(),
    });
  };

  const demoteToMember = async (userId: string) => {
    const batch = writeBatch(db);
    batch.update(doc(db, 'organizations', orgId, 'members', userId), { role: 'member' });
    await batch.commit();
    await updateDoc(doc(db, 'organizations', orgId), {
      memberUserIds: arrayUnion(userId),
      adminUserIds: arrayRemove(userId),
      updatedAt: Date.now(),
    });
  };

  const addDogToOrg = async (dogId: string) => {
    await updateDoc(doc(db, 'dogs', dogId), { orgId, updatedAt: Date.now() });
  };

  const removeDogFromOrg = async (dogId: string) => {
    const { deleteField } = await import('firebase/firestore');
    await updateDoc(doc(db, 'dogs', dogId), { orgId: deleteField(), updatedAt: Date.now() });
  };

  const deleteOrg = async () => {
    // Remove all members sub-docs then delete the org doc
    const memberSnap = await getDocs(orgMembersCol(orgId));
    const pendingSnap = await getDocs(orgPendingCol(orgId));
    const batch = writeBatch(db);
    memberSnap.docs.forEach(d => batch.delete(d.ref));
    pendingSnap.docs.forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, 'organizations', orgId));
    await batch.commit();
  };

  return { updateOrg, inviteMember, removeMember, promoteToAdmin, demoteToMember, addDogToOrg, removeDogFromOrg, deleteOrg };
}

// ─── Create ────────────────────────────────────────────────────────────────────

export function useCreateOrg() {
  const { user } = useAuth();

  const createOrg = async (
    data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'adminUserIds' | 'memberUserIds'>
  ): Promise<string> => {
    const now = Date.now();
    const ref = await addDoc(orgsCol(), stripUndefined({
      ...data,
      adminUserIds: [user!.uid],
      memberUserIds: [],
      createdBy: user!.uid,
      createdAt: now,
      updatedAt: now,
    }));
    // Write creator as admin member
    await setDoc(doc(db, 'organizations', ref.id, 'members', user!.uid), {
      userId: user!.uid,
      displayName: user!.displayName,
      email: user!.email,
      role: 'admin',
      joinedAt: now,
    });
    return ref.id;
  };

  return { createOrg };
}

// ─── Search ────────────────────────────────────────────────────────────────────

export async function searchOrgs(term: string): Promise<Organization[]> {
  const snap = await getDocs(orgsCol());
  const lower = term.toLowerCase();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Organization))
    .filter(o => o.name.toLowerCase().includes(lower));
}

export async function getOrgById(orgId: string): Promise<Organization | null> {
  const snap = await getDoc(doc(db, 'organizations', orgId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Organization;
}

// ─── User search (reused from humans pattern) ──────────────────────────────────

export async function searchUsersByEmail(email: string) {
  const { collection, getDocs: gd, where: w, query: q } = await import('firebase/firestore');
  const snap = await gd(q(collection(db, 'users'), w('email', '==', email)));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}
