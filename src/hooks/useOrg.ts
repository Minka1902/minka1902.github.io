import { useEffect, useState } from 'react';
import {
  addDoc, doc, updateDoc, deleteDoc, setDoc, writeBatch,
  onSnapshot, arrayUnion, arrayRemove, getDocs, query, where,
  getDoc, orderBy, deleteField,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  orgsCol, orgMembersCol, orgPendingCol,
  orgEnrolledCol, orgTasksCol, orgReportsCol,
} from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { stripUndefined } from '@/lib/utils';
import type {
  Organization, OrgMember, PendingOrgMember, OrgMemberRole, OrgStaffRole,
  OrgEnrolledDog, OrgStaffAssignment, OrgServiceType,
  OrgTask, OrgTaskType, OrgTaskStatus,
  OrgDailyReport, DogMood,
} from '@/types';

export { useOrg } from '@/contexts/OrgContext';

// ─── Member read hooks ────────────────────────────────────────────────────────

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

  const approveMember = async (
    userId: string, displayName: string, email: string,
    role: OrgMemberRole = 'staff', staffRole?: OrgStaffRole
  ) => {
    const batch = writeBatch(db);
    batch.set(doc(db, 'organizations', orgId, 'members', userId), stripUndefined({
      userId, displayName, email, role, staffRole, joinedAt: Date.now(), invitedBy: user!.uid,
    }));
    batch.delete(doc(db, 'organizations', orgId, 'pendingMembers', userId));
    await batch.commit();
    const field = role === 'leader' ? 'leaderUserIds' : 'staffUserIds';
    await updateDoc(doc(db, 'organizations', orgId), { [field]: arrayUnion(userId), updatedAt: Date.now() });
  };

  const rejectMember = async (userId: string) => {
    await deleteDoc(doc(db, 'organizations', orgId, 'pendingMembers', userId));
  };

  return { pending, requestJoin, approveMember, rejectMember };
}

// ─── Org management actions ───────────────────────────────────────────────────

export function useOrgActions(orgId: string) {
  const { user } = useAuth();

  const updateOrg = async (data: Partial<Omit<Organization, 'id' | 'createdAt' | 'createdBy'>>) => {
    await updateDoc(doc(db, 'organizations', orgId), stripUndefined({ ...data, updatedAt: Date.now() }));
  };

  /** Leader directly adds a user as staff (skipping pending). */
  const inviteMember = async (
    userId: string, displayName: string, email: string,
    role: OrgMemberRole = 'staff', staffRole?: OrgStaffRole
  ) => {
    const batch = writeBatch(db);
    batch.set(doc(db, 'organizations', orgId, 'members', userId), stripUndefined({
      userId, displayName, email, role, staffRole, joinedAt: Date.now(), invitedBy: user!.uid,
    }));
    await batch.commit();
    const field = role === 'leader' ? 'leaderUserIds' : 'staffUserIds';
    await updateDoc(doc(db, 'organizations', orgId), { [field]: arrayUnion(userId), updatedAt: Date.now() });
  };

  const removeMember = async (userId: string) => {
    await deleteDoc(doc(db, 'organizations', orgId, 'members', userId));
    await updateDoc(doc(db, 'organizations', orgId), {
      staffUserIds: arrayRemove(userId),
      leaderUserIds: arrayRemove(userId),
      updatedAt: Date.now(),
    });
  };

  const promoteToLeader = async (userId: string) => {
    await updateDoc(doc(db, 'organizations', orgId, 'members', userId), { role: 'leader' });
    await updateDoc(doc(db, 'organizations', orgId), {
      leaderUserIds: arrayUnion(userId),
      staffUserIds: arrayRemove(userId),
      updatedAt: Date.now(),
    });
  };

  const demoteToStaff = async (userId: string) => {
    await updateDoc(doc(db, 'organizations', orgId, 'members', userId), { role: 'staff' });
    await updateDoc(doc(db, 'organizations', orgId), {
      staffUserIds: arrayUnion(userId),
      leaderUserIds: arrayRemove(userId),
      updatedAt: Date.now(),
    });
  };

  const updateStaffRole = async (userId: string, staffRole: OrgStaffRole) => {
    await updateDoc(doc(db, 'organizations', orgId, 'members', userId), { staffRole });
  };

  const deleteOrg = async () => {
    const [memberSnap, pendingSnap, enrolledSnap, tasksSnap, reportsSnap] = await Promise.all([
      getDocs(orgMembersCol(orgId)),
      getDocs(orgPendingCol(orgId)),
      getDocs(orgEnrolledCol(orgId)),
      getDocs(orgTasksCol(orgId)),
      getDocs(orgReportsCol(orgId)),
    ]);
    const batch = writeBatch(db);
    [...memberSnap.docs, ...pendingSnap.docs, ...enrolledSnap.docs, ...tasksSnap.docs, ...reportsSnap.docs]
      .forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, 'organizations', orgId));
    await batch.commit();
  };

  return { updateOrg, inviteMember, removeMember, promoteToLeader, demoteToStaff, updateStaffRole, deleteOrg };
}

// ─── Dog enrollment ───────────────────────────────────────────────────────────

export function useEnrolledDogs(orgId: string) {
  const { user } = useAuth();
  const [enrolled, setEnrolled] = useState<OrgEnrolledDog[]>([]);

  useEffect(() => {
    setEnrolled([]);
    if (!orgId) return;
    return onSnapshot(orgEnrolledCol(orgId), snap => {
      setEnrolled(snap.docs.map(d => ({ ...d.data(), dogId: d.id } as OrgEnrolledDog)));
    });
  }, [orgId]);

  const enrollDog = async (
    dogId: string,
    dogName: string,
    mainHumanId: string,
    mainHumanName: string,
    mainHumanEmail: string,
    opts: { dogPhotoURL?: string; mainHumanPhone?: string; serviceTypes?: OrgServiceType[]; orgNotes?: string; specialCareNotes?: string } = {}
  ) => {
    await setDoc(doc(db, 'organizations', orgId, 'enrolledDogs', dogId), stripUndefined({
      dogId, dogName, mainHumanId, mainHumanName, mainHumanEmail,
      dogPhotoURL: opts.dogPhotoURL,
      mainHumanPhone: opts.mainHumanPhone,
      enrolledAt: Date.now(),
      enrolledBy: user!.uid,
      status: 'active',
      checkedIn: false,
      assignedStaff: [],
      serviceTypes: opts.serviceTypes ?? [],
      orgNotes: opts.orgNotes,
      specialCareNotes: opts.specialCareNotes,
      internalTags: [],
    }));
    // Link the dog to this org
    await updateDoc(doc(db, 'dogs', dogId), { orgId, updatedAt: Date.now() });
  };

  const unenrollDog = async (dogId: string) => {
    await deleteDoc(doc(db, 'organizations', orgId, 'enrolledDogs', dogId));
    await updateDoc(doc(db, 'dogs', dogId), { orgId: deleteField(), updatedAt: Date.now() });
  };

  const updateEnrollment = async (dogId: string, data: Partial<OrgEnrolledDog>) => {
    await updateDoc(doc(db, 'organizations', orgId, 'enrolledDogs', dogId), stripUndefined(data as object));
  };

  const checkIn = async (dogId: string) => {
    await updateDoc(doc(db, 'organizations', orgId, 'enrolledDogs', dogId), {
      checkedIn: true,
      checkedInAt: Date.now(),
      checkedInBy: user!.uid,
      checkedOutAt: deleteField(),
    });
  };

  const checkOut = async (dogId: string) => {
    await updateDoc(doc(db, 'organizations', orgId, 'enrolledDogs', dogId), {
      checkedIn: false,
      checkedOutAt: Date.now(),
      checkedInAt: deleteField(),
      checkedInBy: deleteField(),
    });
  };

  const assignStaff = async (
    dogId: string,
    staffUserId: string,
    displayName: string,
    staffRole: OrgStaffRole
  ) => {
    const assignment: OrgStaffAssignment = {
      userId: staffUserId,
      displayName,
      staffRole,
      assignedAt: Date.now(),
      assignedBy: user!.uid,
    };
    const ref = doc(db, 'organizations', orgId, 'enrolledDogs', dogId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const current: OrgStaffAssignment[] = snap.data().assignedStaff ?? [];
    const updated = [...current.filter(s => s.userId !== staffUserId), assignment];
    await updateDoc(ref, { assignedStaff: updated });
    // Also give staff access to the dog
    await updateDoc(doc(db, 'dogs', dogId), { memberUserIds: arrayUnion(staffUserId), updatedAt: Date.now() });
  };

  const unassignStaff = async (dogId: string, staffUserId: string) => {
    const ref = doc(db, 'organizations', orgId, 'enrolledDogs', dogId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const current: OrgStaffAssignment[] = snap.data().assignedStaff ?? [];
    await updateDoc(ref, { assignedStaff: current.filter(s => s.userId !== staffUserId) });
    await updateDoc(doc(db, 'dogs', dogId), { memberUserIds: arrayRemove(staffUserId), updatedAt: Date.now() });
  };

  const updateTags = async (dogId: string, internalTags: string[]) => {
    await updateDoc(doc(db, 'organizations', orgId, 'enrolledDogs', dogId), { internalTags });
  };

  return {
    enrolled,
    enrollDog, unenrollDog, updateEnrollment,
    checkIn, checkOut,
    assignStaff, unassignStaff,
    updateTags,
  };
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export function useOrgTasks(orgId: string, dogId?: string) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<OrgTask[]>([]);

  useEffect(() => {
    setTasks([]);
    if (!orgId) return;
    const q = dogId
      ? query(orgTasksCol(orgId), where('dogId', '==', dogId), orderBy('createdAt', 'desc'))
      : query(orgTasksCol(orgId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({ ...d.data(), id: d.id } as OrgTask)));
    });
  }, [orgId, dogId]);

  const createTask = async (data: {
    dogId: string;
    dogName: string;
    title: string;
    type: OrgTaskType;
    assignedTo: string;
    assignedToName: string;
    dueAt?: number;
    notes?: string;
  }) => {
    const now = Date.now();
    await addDoc(orgTasksCol(orgId), stripUndefined({
      ...data,
      assignedBy: user!.uid,
      assignedByName: user!.displayName ?? '',
      status: 'pending' as OrgTaskStatus,
      createdAt: now,
      updatedAt: now,
    }));
  };

  const updateTaskStatus = async (taskId: string, status: OrgTaskStatus, completionNotes?: string) => {
    const data: Record<string, unknown> = { status, updatedAt: Date.now() };
    if (status === 'done') {
      data.completedAt = Date.now();
      data.completedByName = user!.displayName ?? '';
      if (completionNotes) data.completionNotes = completionNotes;
    }
    await updateDoc(doc(db, 'organizations', orgId, 'tasks', taskId), data);
  };

  const deleteTask = async (taskId: string) => {
    await deleteDoc(doc(db, 'organizations', orgId, 'tasks', taskId));
  };

  return { tasks, createTask, updateTaskStatus, deleteTask };
}

// ─── Daily reports ────────────────────────────────────────────────────────────

export function useOrgDailyReports(orgId: string, dogId?: string) {
  const { user } = useAuth();
  const [reports, setReports] = useState<OrgDailyReport[]>([]);

  useEffect(() => {
    setReports([]);
    if (!orgId) return;
    const q = dogId
      ? query(orgReportsCol(orgId), where('dogId', '==', dogId), orderBy('createdAt', 'desc'))
      : query(orgReportsCol(orgId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setReports(snap.docs.map(d => ({ ...d.data(), id: d.id } as OrgDailyReport)));
    });
  }, [orgId, dogId]);

  const createReport = async (data: {
    dogId: string;
    dogName: string;
    date: string;
    summary: string;
    mood: DogMood;
    activities: string[];
  }) => {
    await addDoc(orgReportsCol(orgId), {
      ...data,
      staffId: user!.uid,
      staffName: user!.displayName ?? '',
      createdAt: Date.now(),
    });
  };

  return { reports, createReport };
}

// ─── Org creation ─────────────────────────────────────────────────────────────

export function useCreateOrg() {
  const { user } = useAuth();

  const createOrg = async (
    data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'leaderUserIds' | 'staffUserIds'>
  ): Promise<string> => {
    const now = Date.now();
    const ref = await addDoc(orgsCol(), stripUndefined({
      ...data,
      leaderUserIds: [user!.uid],
      staffUserIds: [],
      createdBy: user!.uid,
      createdAt: now,
      updatedAt: now,
    }));
    await setDoc(doc(db, 'organizations', ref.id, 'members', user!.uid), {
      userId: user!.uid,
      displayName: user!.displayName,
      email: user!.email,
      role: 'leader',
      joinedAt: now,
    });
    return ref.id;
  };

  return { createOrg };
}

// ─── Search / lookup ──────────────────────────────────────────────────────────

/** Enroll a dog in an org without needing the full useEnrolledDogs hook. */
export async function enrollDogInOrg(
  orgId: string,
  dog: { id: string; name: string; photoURL?: string },
  actorUser: { uid: string; displayName: string | null; email: string | null }
): Promise<void> {
  await setDoc(doc(db, 'organizations', orgId, 'enrolledDogs', dog.id), stripUndefined({
    dogId: dog.id,
    dogName: dog.name,
    dogPhotoURL: dog.photoURL ?? null,
    mainHumanId: actorUser.uid,
    mainHumanName: actorUser.displayName ?? '',
    mainHumanEmail: actorUser.email ?? '',
    enrolledAt: Date.now(),
    enrolledBy: actorUser.uid,
    status: 'active',
    checkedIn: false,
    assignedStaff: [],
    serviceTypes: [],
    internalTags: [],
  }));
  await updateDoc(doc(db, 'dogs', dog.id), { orgId, updatedAt: Date.now() });
}

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
