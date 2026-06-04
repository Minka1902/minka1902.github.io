export { useBusiness } from '@/contexts/BusinessContext';

import { useEffect, useState } from 'react';
import {
  addDoc, arrayRemove, arrayUnion, deleteDoc, doc, getDoc, getDocs,
  onSnapshot, orderBy, query, setDoc, updateDoc, where, writeBatch, type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { stripUndefined } from '@/lib/utils';
import { lookupUserByEmail } from '@/lib/userLookup';
import {
  businessesCol, businessDirectoryCol, bizStaffCol, bizRolesCol, bizCustomersCol, bizPetsCol,
  bizAppointmentsCol, bizInvoicesCol, bizProductsCol, bizShipmentsCol,
} from '@/lib/firestore';
import {
  ALL_CAPABILITIES, DEFAULT_ROLE_TEMPLATES, computeInvoiceTotals,
  type Business, type BusinessRole, type BusinessStaff, type BusinessCustomer,
  type BusinessPet, type Appointment, type Invoice, type Product, type Shipment,
} from '@/types';

// Build the public directory projection of a business and publish it (or remove
// it from the directory when the owner unlists the business).
function buildDirectoryEntry(b: Business) {
  return stripUndefined({
    name: b.name,
    type: b.type,
    description: b.description,
    logoURL: b.logoURL,
    phone: b.phone,
    email: b.email,
    website: b.website,
    city: b.address?.city,
    location: b.location,
    bookable: b.bookable ?? false,
    services: b.services,
    updatedAt: Date.now(),
  });
}

async function syncDirectory(bid: string) {
  const snap = await getDoc(doc(businessesCol(), bid));
  if (!snap.exists()) return;
  const b = { id: bid, ...snap.data() } as Business;
  if (b.listed === false) {
    await deleteDoc(doc(businessDirectoryCol(), bid)).catch(() => undefined);
    return;
  }
  await setDoc(doc(businessDirectoryCol(), bid), buildDirectoryEntry(b));
}

// Generic realtime subscription helper.
function useCollection<T>(
  colFactory: () => ReturnType<typeof bizCustomersCol> | null,
  deps: unknown[],
  constraints: QueryConstraint[] = [],
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const col = colFactory();
    if (!col) { setItems([]); setLoading(false); return; }
    const unsub = onSnapshot(
      constraints.length ? query(col, ...constraints) : col,
      snap => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as T))); setLoading(false); },
      () => setLoading(false),
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { items, loading };
}

// ─── Create a new business (owner bootstrap) ──────────────────────────────────

export function useCreateBusiness() {
  const { user } = useAuth();

  const createBusiness = async (
    data: Pick<Business, 'name' | 'type'> &
      Partial<Pick<Business, 'description' | 'email' | 'phone' | 'website' | 'address' | 'currency' | 'logoURL'>>,
  ): Promise<string> => {
    const now = Date.now();
    const ref = await addDoc(businessesCol(), stripUndefined({
      ...data,
      currency: data.currency ?? 'USD',
      ownerUserId: user!.uid,
      staffUserIds: [user!.uid],
      createdAt: now,
      updatedAt: now,
    } as Business));

    const batch = writeBatch(db);
    // System owner role — all capabilities, undeletable.
    batch.set(doc(bizRolesCol(ref.id), 'owner'), {
      name: 'Owner', capabilities: ALL_CAPABILITIES, isSystem: true, createdAt: now, updatedAt: now,
    });
    // Default starter roles.
    DEFAULT_ROLE_TEMPLATES.forEach((tpl, i) => {
      batch.set(doc(bizRolesCol(ref.id), `role_${i}_${now}`), {
        name: tpl.name, capabilities: tpl.capabilities, createdAt: now, updatedAt: now,
      });
    });
    // Owner staff record.
    batch.set(doc(bizStaffCol(ref.id), user!.uid), stripUndefined({
      userId: user!.uid,
      displayName: user!.displayName,
      email: user!.email,
      photoURL: user!.photoURL,
      roleId: 'owner',
      capabilities: ALL_CAPABILITIES,
      active: true,
      joinedAt: now,
      invitedBy: user!.uid,
    } as BusinessStaff));
    await batch.commit();
    // Publish the public directory listing (best-effort).
    await syncDirectory(ref.id).catch(() => undefined);
    return ref.id;
  };

  return { createBusiness };
}

// ─── Business profile ─────────────────────────────────────────────────────────

export function useBusinessActions(bid: string) {
  const updateBusiness = async (data: Partial<Business>) => {
    await updateDoc(doc(businessesCol(), bid), stripUndefined({ ...data, updatedAt: Date.now() }));
    await syncDirectory(bid).catch(() => undefined);
  };
  const deleteBusiness = async () => {
    // Best-effort cascade delete of subcollections, then the business doc.
    const subs = [bizStaffCol, bizRolesCol, bizCustomersCol, bizPetsCol,
      bizAppointmentsCol, bizInvoicesCol, bizProductsCol, bizShipmentsCol];
    for (const sub of subs) {
      const snap = await getDocs(sub(bid));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      if (snap.size) await batch.commit();
    }
    await deleteDoc(doc(businessDirectoryCol(), bid)).catch(() => undefined);
    await deleteDoc(doc(businessesCol(), bid));
  };
  return { updateBusiness, deleteBusiness };
}

// ─── Roles ────────────────────────────────────────────────────────────────────

export function useBusinessRoles(bid: string) {
  const { user } = useAuth();
  const { items: roles, loading } = useCollection<BusinessRole>(
    () => (bid ? bizRolesCol(bid) : null), [bid],
  );

  const createRole = async (name: string, capabilities: BusinessRole['capabilities']) => {
    const now = Date.now();
    await addDoc(bizRolesCol(bid), { name, capabilities, createdAt: now, updatedAt: now });
  };

  // Editing a role fans the new capabilities out to every staff holding it so
  // the denormalized snapshots stay in sync (firestore.rules read those copies).
  const updateRole = async (roleId: string, data: Partial<BusinessRole>) => {
    const batch = writeBatch(db);
    batch.update(doc(bizRolesCol(bid), roleId), stripUndefined({ ...data, updatedAt: Date.now() }));
    if (data.capabilities) {
      const staffSnap = await getDocs(query(bizStaffCol(bid), where('roleId', '==', roleId)));
      staffSnap.docs.forEach(d => {
        // Never downgrade the owner's own record below full caps.
        if (d.id === user?.uid && roleId === 'owner') return;
        batch.update(d.ref, { capabilities: data.capabilities });
      });
    }
    await batch.commit();
  };

  const deleteRole = async (roleId: string) => {
    await deleteDoc(doc(bizRolesCol(bid), roleId));
  };

  return { roles, loading, createRole, updateRole, deleteRole };
}

// ─── Staff ──────────────────────────────────────────────────────────────────

export function useBusinessStaff(bid: string) {
  const { user } = useAuth();
  const { items: staff, loading } = useCollection<BusinessStaff>(
    () => (bid ? bizStaffCol(bid) : null), [bid],
  );

  // Invite by looking up a registered user (by email) and assigning a role.
  // Staff must be real app users — reject addresses with no PackOps account.
  const inviteStaff = async (email: string, roleId: string): Promise<{ ok: boolean; reason?: string }> => {
    const u = await lookupUserByEmail(email);
    if (!u) return { ok: false, reason: 'No PackOps user with that email.' };
    const roleSnap = await getDocs(query(bizRolesCol(bid), where('__name__', '==', roleId)));
    const caps = roleSnap.empty ? [] : (roleSnap.docs[0].data() as BusinessRole).capabilities;
    const now = Date.now();
    const batch = writeBatch(db);
    batch.set(doc(bizStaffCol(bid), u.uid), stripUndefined({
      userId: u.uid, displayName: u.displayName, email: u.email, photoURL: u.photoURL,
      roleId, capabilities: caps, active: true, joinedAt: now, invitedBy: user!.uid,
    } as BusinessStaff));
    batch.update(doc(businessesCol(), bid), { staffUserIds: arrayUnionCompat(u.uid) });
    await batch.commit();
    return { ok: true };
  };

  const assignRole = async (userId: string, roleId: string) => {
    const roleSnap = await getDocs(query(bizRolesCol(bid), where('__name__', '==', roleId)));
    const caps = roleSnap.empty ? [] : (roleSnap.docs[0].data() as BusinessRole).capabilities;
    await updateDoc(doc(bizStaffCol(bid), userId), { roleId, capabilities: caps });
  };

  const setStaffActive = async (userId: string, active: boolean) => {
    await updateDoc(doc(bizStaffCol(bid), userId), { active });
  };

  const removeStaff = async (userId: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(bizStaffCol(bid), userId));
    batch.update(doc(businessesCol(), bid), { staffUserIds: arrayRemoveCompat(userId) });
    await batch.commit();
  };

  return { staff, loading, inviteStaff, assignRole, setStaffActive, removeStaff };
}

// ─── Customers & pets ─────────────────────────────────────────────────────────

export function useCustomers(bid: string) {
  const { user } = useAuth();
  const { items: customers, loading } = useCollection<BusinessCustomer>(
    () => (bid ? bizCustomersCol(bid) : null), [bid], [orderBy('createdAt', 'desc')],
  );
  const createCustomer = async (data: Omit<BusinessCustomer, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const now = Date.now();
    return addDoc(bizCustomersCol(bid), stripUndefined({ ...data, createdBy: user!.uid, createdAt: now, updatedAt: now }));
  };
  const updateCustomer = async (id: string, data: Partial<BusinessCustomer>) => {
    await updateDoc(doc(bizCustomersCol(bid), id), stripUndefined({ ...data, updatedAt: Date.now() }));
  };
  const deleteCustomer = async (id: string) => { await deleteDoc(doc(bizCustomersCol(bid), id)); };
  return { customers, loading, createCustomer, updateCustomer, deleteCustomer };
}

export function usePets(bid: string, customerId?: string) {
  const constraints = customerId ? [where('customerId', '==', customerId)] : [];
  const { items: pets, loading } = useCollection<BusinessPet>(
    () => (bid ? bizPetsCol(bid) : null), [bid, customerId], constraints,
  );
  const createPet = async (data: Omit<BusinessPet, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    return addDoc(bizPetsCol(bid), stripUndefined({ ...data, createdAt: now, updatedAt: now }));
  };
  const updatePet = async (id: string, data: Partial<BusinessPet>) => {
    await updateDoc(doc(bizPetsCol(bid), id), stripUndefined({ ...data, updatedAt: Date.now() }));
  };
  const deletePet = async (id: string) => { await deleteDoc(doc(bizPetsCol(bid), id)); };
  return { pets, loading, createPet, updatePet, deletePet };
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export function useAppointments(bid: string, range?: { from: number; to: number }) {
  const constraints: QueryConstraint[] = [orderBy('startAt', 'asc')];
  if (range) { constraints.unshift(where('startAt', '>=', range.from), where('startAt', '<=', range.to)); }
  const { user } = useAuth();
  const { items: appointments, loading } = useCollection<Appointment>(
    () => (bid ? bizAppointmentsCol(bid) : null), [bid, range?.from, range?.to], constraints,
  );
  const createAppointment = async (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const now = Date.now();
    return addDoc(bizAppointmentsCol(bid), stripUndefined({ ...data, createdBy: user!.uid, createdAt: now, updatedAt: now }));
  };
  const updateAppointment = async (id: string, data: Partial<Appointment>) => {
    await updateDoc(doc(bizAppointmentsCol(bid), id), stripUndefined({ ...data, updatedAt: Date.now() }));
  };
  const deleteAppointment = async (id: string) => { await deleteDoc(doc(bizAppointmentsCol(bid), id)); };
  return { appointments, loading, createAppointment, updateAppointment, deleteAppointment };
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export function useInvoices(bid: string) {
  const { user } = useAuth();
  const { items: invoices, loading } = useCollection<Invoice>(
    () => (bid ? bizInvoicesCol(bid) : null), [bid], [orderBy('createdAt', 'desc')],
  );
  const createInvoice = async (
    data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'subtotal' | 'total' | 'amountPaid' | 'payments' | 'number'> &
      Partial<Pick<Invoice, 'number'>>,
  ) => {
    const now = Date.now();
    const { subtotal, total } = computeInvoiceTotals(data.lineItems, data.taxRate);
    return addDoc(bizInvoicesCol(bid), stripUndefined({
      ...data,
      number: data.number ?? `INV-${now}`,
      subtotal, total, amountPaid: 0, payments: [],
      createdBy: user!.uid, createdAt: now, updatedAt: now,
    } as Invoice));
  };
  const updateInvoice = async (id: string, data: Partial<Invoice>) => {
    const patch: Partial<Invoice> = { ...data, updatedAt: Date.now() };
    if (data.lineItems) {
      const { subtotal, total } = computeInvoiceTotals(data.lineItems, data.taxRate);
      patch.subtotal = subtotal; patch.total = total;
    }
    await updateDoc(doc(bizInvoicesCol(bid), id), stripUndefined(patch));
  };
  const recordPayment = async (inv: Invoice, amount: number, method: Invoice['payments'][number]['method']) => {
    const payments = [...inv.payments, { amount, method, paidAt: Date.now(), recordedBy: user!.uid }];
    const amountPaid = Math.round(payments.reduce((s, p) => s + p.amount, 0) * 100) / 100;
    const status: Invoice['status'] = amountPaid >= inv.total ? 'paid' : amountPaid > 0 ? 'partial' : inv.status;
    await updateDoc(doc(bizInvoicesCol(bid), inv.id), { payments, amountPaid, status, updatedAt: Date.now() });
  };
  const deleteInvoice = async (id: string) => { await deleteDoc(doc(bizInvoicesCol(bid), id)); };
  return { invoices, loading, createInvoice, updateInvoice, recordPayment, deleteInvoice };
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export function useProducts(bid: string) {
  const { items: products, loading } = useCollection<Product>(
    () => (bid ? bizProductsCol(bid) : null), [bid], [orderBy('name', 'asc')],
  );
  const createProduct = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    return addDoc(bizProductsCol(bid), stripUndefined({ ...data, createdAt: now, updatedAt: now }));
  };
  const updateProduct = async (id: string, data: Partial<Product>) => {
    await updateDoc(doc(bizProductsCol(bid), id), stripUndefined({ ...data, updatedAt: Date.now() }));
  };
  const deleteProduct = async (id: string) => { await deleteDoc(doc(bizProductsCol(bid), id)); };
  return { products, loading, createProduct, updateProduct, deleteProduct };
}

// ─── Shipments ────────────────────────────────────────────────────────────────

export function useShipments(bid: string) {
  const { user } = useAuth();
  const { items: shipments, loading } = useCollection<Shipment>(
    () => (bid ? bizShipmentsCol(bid) : null), [bid], [orderBy('createdAt', 'desc')],
  );
  const createShipment = async (data: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const now = Date.now();
    return addDoc(bizShipmentsCol(bid), stripUndefined({ ...data, createdBy: user!.uid, createdAt: now, updatedAt: now }));
  };
  const updateShipment = async (id: string, data: Partial<Shipment>) => {
    await updateDoc(doc(bizShipmentsCol(bid), id), stripUndefined({ ...data, updatedAt: Date.now() }));
  };
  const deleteShipment = async (id: string) => { await deleteDoc(doc(bizShipmentsCol(bid), id)); };
  return { shipments, loading, createShipment, updateShipment, deleteShipment };
}

// ─── small local helpers ──────────────────────────────────────────────────────
function arrayUnionCompat(v: string) { return arrayUnion(v); }
function arrayRemoveCompat(v: string) { return arrayRemove(v); }
