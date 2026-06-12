export { useBusiness } from '@/contexts/BusinessContext';

import { useEffect, useState } from 'react';
import {
  addDoc, arrayRemove, arrayUnion, deleteDoc, doc, getDoc, getDocs, increment,
  onSnapshot, orderBy, query, runTransaction, setDoc, updateDoc, where, writeBatch,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { stripUndefined } from '@/lib/utils';
import { lookupUserByEmail } from '@/lib/userLookup';
import {
  businessesCol, businessDirectoryCol, bizStaffCol, bizRolesCol, bizCustomersCol, bizPetsCol,
  bizAppointmentsCol, bizInvoicesCol, bizProductsCol, bizShipmentsCol,
  bizOrdersCol, bizStaysCol, bizServicesCol, bizShiftsCol, bizTimeOffCol,
  bizSuppliersCol, bizPurchaseOrdersCol, bizThreadsCol, bizThreadMessagesCol, bizReportCardsCol,
  bizPackagesCol, bizCustomerPackagesCol, bizAdoptionListingsCol,
  bizAdoptionApplicationsCol, bizChartEntriesCol, bizClassesCol,
  bizEnrollmentsCol, bizLittersCol, bizWaitlistCol,
  directoryCatalogCol, directoryAdoptablesCol, directoryClassesCol,
  directoryLittersCol, directoryReviewsCol,
} from '@/lib/firestore';
import {
  ALL_CAPABILITIES, DEFAULT_ROLE_TEMPLATES, TYPE_MODULE_PRESETS,
  computeInvoiceTotals, computeOrderTotals, findStockShortages, isModuleEnabled,
  type Business, type BusinessRole, type BusinessStaff, type BusinessCustomer,
  type BusinessPet, type Appointment, type Invoice, type Product, type Shipment,
  type Order, type OrderItem, type OrderStatus,
  type Stay, type StayDailyNote, type StayStatus,
  type BusinessService,
  computePurchaseOrderTotal, type PurchaseOrder, type Supplier,
  type Shift, type TimeOffRequest, type TimeOffStatus,
  type MessageThread, type ThreadMessage,
} from '@/types';
import { fullDates, hasCapacityForRange, todayStr } from '@/lib/occupancy';

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
    availability: b.availability,
    slotMinutes: b.slotMinutes,
    currency: b.currency,
    // Commerce summary — customers need the fulfilment/payment options to order.
    orderable: (b.commerce?.ordersOpen ?? false) && isModuleEnabled(b, 'orders'),
    fulfillment: b.commerce?.fulfillment,
    deliveryFee: b.commerce?.deliveryFee,
    paymentMethods: b.commerce?.paymentMethods,
    // Boarding summary — fullDates is maintained separately by
    // refreshBoardingAvailability and survives via the recursive merge.
    boarding: b.boarding
      ? stripUndefined({
          requestsOpen: b.boarding.requestsOpen && isModuleEnabled(b, 'boarding'),
          pricePerNight: b.boarding.pricePerNight,
        })
      : undefined,
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
  // Merge so the separately-maintained busySlots field survives profile edits.
  await setDoc(doc(businessDirectoryCol(), bid), buildDirectoryEntry(b), { merge: true });
}

// Recompute the public "busy" intervals (upcoming, un-cancelled appointments) so
// customers can't pick an already-taken slot. Best-effort and merge-written.
async function refreshBusySlots(bid: string) {
  try {
    const now = Date.now();
    const snap = await getDocs(query(bizAppointmentsCol(bid), where('endAt', '>', now)));
    const busy = snap.docs
      .map(d => d.data() as Appointment)
      .filter(a => a.status === 'scheduled' || a.status === 'confirmed')
      .map(a => ({ start: a.startAt, end: a.endAt }));
    await setDoc(doc(businessDirectoryCol(), bid), { busySlots: busy, updatedAt: now }, { merge: true });
  } catch { /* directory may not exist for unlisted businesses — ignore */ }
}

// ─── Public catalog sync ──────────────────────────────────────────────────────
// The order page reads businessDirectory/{bid}/catalog — a projection that only
// exposes name / category / price / inStock (never raw stock numbers). Synced on
// product mutations while online ordering is on; fully rebuilt on toggle.

function toCatalogDoc(p: Product) {
  return stripUndefined({
    name: p.name,
    category: p.category,
    unitPrice: p.unitPrice,
    inStock: p.active && p.stockQty > 0,
    updatedAt: Date.now(),
  });
}

async function isOrderable(bid: string): Promise<boolean> {
  const snap = await getDoc(doc(businessDirectoryCol(), bid)).catch(() => null);
  return snap?.exists() === true && snap.data()?.orderable === true;
}

// Upsert (or, for inactive products, remove) one catalog projection. Best-effort.
async function syncCatalogItem(bid: string, productId: string, product: Product | null) {
  try {
    if (!(await isOrderable(bid))) return;
    const ref = doc(directoryCatalogCol(bid), productId);
    if (!product || !product.active) await deleteDoc(ref);
    else await setDoc(ref, toCatalogDoc(product));
  } catch { /* projection is best-effort; the accept transaction is the truth */ }
}

// Rebuild the whole catalog projection (Settings toggle, module changes).
export async function resyncCatalog(bid: string, ordersOpen: boolean) {
  const existing = await getDocs(directoryCatalogCol(bid)).catch(() => null);
  const batch = writeBatch(db);
  existing?.docs.forEach(d => batch.delete(d.ref));
  if (ordersOpen) {
    const products = await getDocs(bizProductsCol(bid));
    products.docs.forEach(d => {
      const p = d.data() as Product;
      if (p.active) batch.set(doc(directoryCatalogCol(bid), d.id), toCatalogDoc(p));
    });
  }
  await batch.commit();
}

// Refresh inStock for the products an order touched (post-transaction).
async function refreshCatalogStock(bid: string, productIds: string[]) {
  try {
    if (!(await isOrderable(bid))) return;
    for (const pid of productIds) {
      const snap = await getDoc(doc(bizProductsCol(bid), pid));
      if (!snap.exists()) continue;
      const p = snap.data() as Product;
      await setDoc(doc(directoryCatalogCol(bid), pid),
        { inStock: p.active && p.stockQty > 0, updatedAt: Date.now() }, { merge: true });
    }
  } catch { /* best-effort */ }
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
      Partial<Omit<Business, 'id' | 'name' | 'type' | 'ownerUserId' | 'staffUserIds' | 'createdAt' | 'updatedAt'>>,
  ): Promise<string> => {
    const now = Date.now();
    const ref = await addDoc(businessesCol(), stripUndefined({
      ...data,
      currency: data.currency ?? 'USD',
      // Each business type starts with the modules it actually needs; the owner
      // can adjust the set later in Settings.
      modules: data.modules ?? TYPE_MODULE_PRESETS[data.type],
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
      bizAppointmentsCol, bizInvoicesCol, bizProductsCol, bizShipmentsCol,
      bizOrdersCol, bizStaysCol, bizServicesCol, bizShiftsCol, bizTimeOffCol,
      bizSuppliersCol, bizPurchaseOrdersCol, bizThreadsCol, bizReportCardsCol,
      bizPackagesCol, bizCustomerPackagesCol, bizAdoptionListingsCol,
      bizAdoptionApplicationsCol, bizChartEntriesCol, bizClassesCol,
      bizEnrollmentsCol, bizLittersCol, bizWaitlistCol,
      directoryCatalogCol, directoryAdoptablesCol, directoryClassesCol,
      directoryLittersCol, directoryReviewsCol];
    for (const sub of subs) {
      const snap = await getDocs(sub(bid)).catch(() => null);
      if (!snap?.size) continue;
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
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
    const ref = await addDoc(bizAppointmentsCol(bid), stripUndefined({ ...data, createdBy: user!.uid, createdAt: now, updatedAt: now }));
    void refreshBusySlots(bid);
    return ref;
  };
  const updateAppointment = async (id: string, data: Partial<Appointment>) => {
    await updateDoc(doc(bizAppointmentsCol(bid), id), stripUndefined({ ...data, updatedAt: Date.now() }));
    void refreshBusySlots(bid);
  };
  const deleteAppointment = async (id: string) => {
    await deleteDoc(doc(bizAppointmentsCol(bid), id));
    void refreshBusySlots(bid);
  };
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
    const ref = await addDoc(bizProductsCol(bid), stripUndefined({ ...data, createdAt: now, updatedAt: now }));
    void syncCatalogItem(bid, ref.id, { ...data, id: ref.id, createdAt: now, updatedAt: now });
    return ref;
  };
  const updateProduct = async (id: string, data: Partial<Product>) => {
    await updateDoc(doc(bizProductsCol(bid), id), stripUndefined({ ...data, updatedAt: Date.now() }));
    const snap = await getDoc(doc(bizProductsCol(bid), id));
    if (snap.exists()) void syncCatalogItem(bid, id, { id, ...snap.data() } as Product);
  };
  const deleteProduct = async (id: string) => {
    await deleteDoc(doc(bizProductsCol(bid), id));
    void syncCatalogItem(bid, id, null);
  };
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

// ─── Orders ───────────────────────────────────────────────────────────────────

// Thrown by acceptOrder when stock can't cover the order; the UI lists the
// short items so staff can reject or restock.
export class OrderStockError extends Error {
  shortages: ReturnType<typeof findStockShortages>;
  constructor(shortages: ReturnType<typeof findStockShortages>) {
    super(`Insufficient stock: ${shortages.map(s => `${s.name} (${s.available}/${s.requested})`).join(', ')}`);
    this.name = 'OrderStockError';
    this.shortages = shortages;
  }
}

// Quantity per product, with duplicate lines folded together so the stock
// transaction touches each product doc exactly once.
function quantitiesByProduct(items: OrderItem[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const i of items) map.set(i.productId, (map.get(i.productId) ?? 0) + i.quantity);
  return map;
}

export function useOrders(bid: string) {
  const { user } = useAuth();
  const { items: orders, loading } = useCollection<Order>(
    () => (bid ? bizOrdersCol(bid) : null), [bid], [orderBy('createdAt', 'desc')],
  );

  const createOrder = async (
    data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'subtotal' | 'total' | 'status' | 'source' | 'paymentStatus'>,
  ) => {
    const now = Date.now();
    const { subtotal, total } = computeOrderTotals(data.items, data.deliveryFee ?? 0);
    return addDoc(bizOrdersCol(bid), stripUndefined({
      ...data,
      subtotal, total,
      status: 'placed',
      source: 'staff',
      // 'online' is record-only today: the payment is considered collected at
      // placement. In-person / on-delivery orders start unpaid.
      paymentStatus: data.paymentMethod === 'online' ? 'paid' : 'unpaid',
      createdBy: user!.uid, createdAt: now, updatedAt: now,
    } as Order));
  };

  // Accept = the single point where stock moves out. Transactional so two
  // staffers accepting concurrently can't oversell.
  const acceptOrder = async (order: Order) => {
    const wanted = quantitiesByProduct(order.items);
    await runTransaction(db, async tx => {
      const refs = [...wanted.keys()].map(pid => doc(bizProductsCol(bid), pid));
      const snaps = await Promise.all(refs.map(r => tx.get(r)));
      const stockById: Record<string, number | undefined> = {};
      snaps.forEach((s, i) => { stockById[refs[i].id] = s.exists() ? (s.data() as Product).stockQty : undefined; });
      const shortages = findStockShortages(
        [...wanted.entries()].map(([productId, quantity]) => ({
          productId, quantity,
          name: order.items.find(it => it.productId === productId)!.name,
          unitPrice: 0,
        })),
        stockById,
      );
      if (shortages.length) throw new OrderStockError(shortages);
      const now = Date.now();
      refs.forEach(r => {
        tx.update(r, { stockQty: stockById[r.id]! - wanted.get(r.id)!, updatedAt: now });
      });
      tx.update(doc(bizOrdersCol(bid), order.id), { status: 'accepted', stockAdjusted: true, updatedAt: now });
    });
    void refreshCatalogStock(bid, [...wanted.keys()]);
    void postSystemMessage(bid, { userId: order.customerUserId, name: order.customerName },
      'Your order was accepted and is being prepared.');
  };

  // Cancel / reject. Returns held stock when the order had already been accepted.
  const closeOrder = async (order: Order, status: 'cancelled' | 'rejected') => {
    if (!order.stockAdjusted) {
      await updateDoc(doc(bizOrdersCol(bid), order.id), { status, updatedAt: Date.now() });
    } else {
      const held = quantitiesByProduct(order.items);
      await runTransaction(db, async tx => {
        const refs = [...held.keys()].map(pid => doc(bizProductsCol(bid), pid));
        const snaps = await Promise.all(refs.map(r => tx.get(r)));
        const now = Date.now();
        snaps.forEach((s, i) => {
          if (!s.exists()) return; // product deleted meanwhile — nothing to restock
          tx.update(refs[i], { stockQty: (s.data() as Product).stockQty + held.get(refs[i].id)!, updatedAt: now });
        });
        tx.update(doc(bizOrdersCol(bid), order.id), { status, stockAdjusted: false, updatedAt: now });
      });
      void refreshCatalogStock(bid, [...held.keys()]);
    }
    void postSystemMessage(bid, { userId: order.customerUserId, name: order.customerName },
      status === 'rejected' ? 'Your order was rejected.' : 'Your order was cancelled.');
  };

  const ORDER_STATUS_MESSAGES: Partial<Record<OrderStatus, string>> = {
    preparing: 'Your order is being prepared.',
    ready_for_pickup: 'Your order is ready for pickup!',
    out_for_delivery: 'Your order is out for delivery.',
    completed: 'Your order is complete. Thank you!',
  };

  const updateOrderStatus = async (order: Order, status: OrderStatus) => {
    await updateDoc(doc(bizOrdersCol(bid), order.id), { status, updatedAt: Date.now() });
    const text = ORDER_STATUS_MESSAGES[status];
    if (text) void postSystemMessage(bid, { userId: order.customerUserId, name: order.customerName }, text);
  };

  const setOrderPaid = async (id: string, paymentStatus: Order['paymentStatus']) => {
    await updateDoc(doc(bizOrdersCol(bid), id), { paymentStatus, updatedAt: Date.now() });
  };

  // Raise an invoice mirroring the order (items + delivery fee line). Marks the
  // invoice paid right away when the order's payment was already collected.
  const createInvoiceFromOrder = async (order: Order) => {
    const now = Date.now();
    const lineItems = [
      ...order.items.map(i => ({ description: i.name, quantity: i.quantity, unitPrice: i.unitPrice, productId: i.productId })),
      ...(order.deliveryFee ? [{ description: 'Delivery', quantity: 1, unitPrice: order.deliveryFee }] : []),
    ];
    const { subtotal, total } = computeInvoiceTotals(lineItems);
    const paid = order.paymentStatus === 'paid';
    const ref = await addDoc(bizInvoicesCol(bid), stripUndefined({
      number: `INV-${now}`,
      customerId: order.customerId ?? '',
      customerName: order.customerName,
      lineItems, subtotal, total,
      amountPaid: paid ? total : 0,
      status: paid ? 'paid' : 'sent',
      payments: paid ? [{ amount: total, method: 'other', paidAt: now, recordedBy: user!.uid }] : [],
      issuedAt: now,
      notes: `Order ${order.id}`,
      createdBy: user!.uid, createdAt: now, updatedAt: now,
    } as Omit<Invoice, 'id'>));
    await updateDoc(doc(bizOrdersCol(bid), order.id), { invoiceId: ref.id, updatedAt: now });
    return ref;
  };

  // Hand a carrier delivery over to the shipments module.
  const createShipmentFromOrder = async (order: Order) => {
    const now = Date.now();
    const ref = await addDoc(bizShipmentsCol(bid), stripUndefined({
      customerId: order.customerId,
      customerName: order.customerName,
      invoiceId: order.invoiceId,
      items: order.items.map(i => ({ productId: i.productId, productName: i.name, quantity: i.quantity })),
      destinationAddress: order.deliveryAddress,
      status: 'pending',
      notes: `Order ${order.id}`,
      createdBy: user!.uid, createdAt: now, updatedAt: now,
    } as Omit<Shipment, 'id'>));
    await updateDoc(doc(bizOrdersCol(bid), order.id), { shipmentId: ref.id, updatedAt: now });
    return ref;
  };

  const deleteOrder = async (id: string) => { await deleteDoc(doc(bizOrdersCol(bid), id)); };

  return {
    orders, loading, createOrder, acceptOrder, closeOrder, updateOrderStatus,
    setOrderPaid, createInvoiceFromOrder, createShipmentFromOrder, deleteOrder,
  };
}

// ─── Services & price list ────────────────────────────────────────────────────

// Publish the active services as a priced menu on the directory entry so the
// booking page can show real prices/durations. Best-effort, like busySlots.
async function refreshServiceMenu(bid: string) {
  try {
    const snap = await getDocs(bizServicesCol(bid));
    const menu = snap.docs
      .map(d => d.data() as BusinessService)
      .filter(s => s.active)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(s => stripUndefined({ name: s.name, price: s.price, durationMinutes: s.durationMinutes }));
    await setDoc(doc(businessDirectoryCol(), bid), { serviceMenu: menu, updatedAt: Date.now() }, { merge: true });
  } catch { /* directory may not exist for unlisted businesses — ignore */ }
}

export function useServices(bid: string) {
  const { items: services, loading } = useCollection<BusinessService>(
    () => (bid ? bizServicesCol(bid) : null), [bid], [orderBy('name', 'asc')],
  );
  const createService = async (data: Omit<BusinessService, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const ref = await addDoc(bizServicesCol(bid), stripUndefined({ ...data, createdAt: now, updatedAt: now }));
    void refreshServiceMenu(bid);
    return ref;
  };
  const updateService = async (id: string, data: Partial<BusinessService>) => {
    await updateDoc(doc(bizServicesCol(bid), id), stripUndefined({ ...data, updatedAt: Date.now() }));
    void refreshServiceMenu(bid);
  };
  const deleteService = async (id: string) => {
    await deleteDoc(doc(bizServicesCol(bid), id));
    void refreshServiceMenu(bid);
  };
  return { services, loading, createService, updateService, deleteService };
}

// ─── Messaging ────────────────────────────────────────────────────────────────
// One thread per customer app-user; the thread doc id IS the customer uid, so
// find-or-create is a single merge write. In-app only — no push/email.

async function bumpThread(
  bid: string,
  customer: { userId: string; name: string },
  lastMessageText: string,
  unread: 'customer' | 'staff',
) {
  const bizSnap = await getDoc(doc(businessesCol(), bid));
  const businessName = bizSnap.exists() ? (bizSnap.data() as Business).name : '';
  const now = Date.now();
  await setDoc(doc(bizThreadsCol(bid), customer.userId), {
    customerUserId: customer.userId,
    customerName: customer.name,
    businessId: bid,
    businessName,
    lastMessageAt: now,
    lastMessageText,
    ...(unread === 'customer' ? { unreadByCustomer: increment(1) } : { unreadByStaff: increment(1) }),
    updatedAt: now,
  }, { merge: true });
}

// Posted by the acting client on key transitions (order status, stay approval…).
// Best-effort: a missing customerUserId (walk-in customer) just skips it.
export async function postSystemMessage(
  bid: string,
  customer: { userId?: string; name: string },
  text: string,
) {
  if (!customer.userId) return;
  try {
    await bumpThread(bid, { userId: customer.userId, name: customer.name }, text, 'customer');
    await addDoc(bizThreadMessagesCol(bid, customer.userId), {
      at: Date.now(), fromUserId: 'system', fromName: 'Update', fromSide: 'staff', kind: 'system', text,
    } satisfies Omit<ThreadMessage, 'id'>);
  } catch { /* messaging is best-effort on top of the real transition */ }
}

export function useThreads(bid: string) {
  const { user } = useAuth();
  const { items: threads, loading } = useCollection<MessageThread>(
    () => (bid ? bizThreadsCol(bid) : null), [bid], [orderBy('lastMessageAt', 'desc')],
  );

  const sendStaffMessage = async (thread: MessageThread, text: string) => {
    await bumpThread(bid, { userId: thread.customerUserId, name: thread.customerName }, text, 'customer');
    await addDoc(bizThreadMessagesCol(bid, thread.id), {
      at: Date.now(), fromUserId: user!.uid, fromName: user!.displayName ?? 'Staff',
      fromSide: 'staff', kind: 'chat', text,
    } satisfies Omit<ThreadMessage, 'id'>);
  };

  const markReadByStaff = async (tid: string) => {
    await updateDoc(doc(bizThreadsCol(bid), tid), { unreadByStaff: 0 });
  };

  return { threads, loading, sendStaffMessage, markReadByStaff };
}

export function useThreadMessages(bid: string, tid: string | null) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  useEffect(() => {
    if (!bid || !tid) { setMessages([]); return; }
    const unsub = onSnapshot(
      query(bizThreadMessagesCol(bid, tid), orderBy('at', 'asc')),
      snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ThreadMessage))),
      () => setMessages([]),
    );
    return () => unsub();
  }, [bid, tid]);
  return { messages };
}

// ─── Staff shifts & time off ──────────────────────────────────────────────────

export function useShifts(bid: string) {
  const { items: shifts, loading } = useCollection<Shift>(
    () => (bid ? bizShiftsCol(bid) : null), [bid], [orderBy('date', 'asc')],
  );
  const createShift = async (data: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    return addDoc(bizShiftsCol(bid), stripUndefined({ ...data, createdAt: now, updatedAt: now }));
  };
  const updateShift = async (id: string, data: Partial<Shift>) => {
    await updateDoc(doc(bizShiftsCol(bid), id), stripUndefined({ ...data, updatedAt: Date.now() }));
  };
  const deleteShift = async (id: string) => { await deleteDoc(doc(bizShiftsCol(bid), id)); };
  return { shifts, loading, createShift, updateShift, deleteShift };
}

export function useTimeOff(bid: string) {
  const { user } = useAuth();
  const { items: requests, loading } = useCollection<TimeOffRequest>(
    () => (bid ? bizTimeOffCol(bid) : null), [bid], [orderBy('startDate', 'asc')],
  );
  // Staff file their own requests (rules enforce staffUserId == uid).
  const requestTimeOff = async (data: Pick<TimeOffRequest, 'startDate' | 'endDate' | 'reason'>) => {
    const now = Date.now();
    return addDoc(bizTimeOffCol(bid), stripUndefined({
      ...data,
      staffUserId: user!.uid,
      staffName: user!.displayName ?? 'Staff',
      status: 'requested',
      createdAt: now, updatedAt: now,
    } as TimeOffRequest));
  };
  const decideTimeOff = async (id: string, status: TimeOffStatus) => {
    await updateDoc(doc(bizTimeOffCol(bid), id), { status, updatedAt: Date.now() });
  };
  const deleteTimeOff = async (id: string) => { await deleteDoc(doc(bizTimeOffCol(bid), id)); };
  return { requests, loading, requestTimeOff, decideTimeOff, deleteTimeOff };
}

// ─── Purchasing / supplier orders ─────────────────────────────────────────────

export function useSuppliers(bid: string) {
  const { items: suppliers, loading } = useCollection<Supplier>(
    () => (bid ? bizSuppliersCol(bid) : null), [bid], [orderBy('name', 'asc')],
  );
  const createSupplier = async (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    return addDoc(bizSuppliersCol(bid), stripUndefined({ ...data, createdAt: now, updatedAt: now }));
  };
  const updateSupplier = async (id: string, data: Partial<Supplier>) => {
    await updateDoc(doc(bizSuppliersCol(bid), id), stripUndefined({ ...data, updatedAt: Date.now() }));
  };
  const deleteSupplier = async (id: string) => { await deleteDoc(doc(bizSuppliersCol(bid), id)); };
  return { suppliers, loading, createSupplier, updateSupplier, deleteSupplier };
}

export function usePurchaseOrders(bid: string) {
  const { user } = useAuth();
  const { items: purchaseOrders, loading } = useCollection<PurchaseOrder>(
    () => (bid ? bizPurchaseOrdersCol(bid) : null), [bid], [orderBy('createdAt', 'desc')],
  );

  const createPurchaseOrder = async (
    data: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'total'>,
  ) => {
    const now = Date.now();
    return addDoc(bizPurchaseOrdersCol(bid), stripUndefined({
      ...data,
      total: computePurchaseOrderTotal(data.items),
      createdBy: user!.uid, createdAt: now, updatedAt: now,
    } as PurchaseOrder));
  };

  const updatePurchaseOrder = async (id: string, data: Partial<PurchaseOrder>) => {
    const patch: Partial<PurchaseOrder> = { ...data, updatedAt: Date.now() };
    if (data.items) patch.total = computePurchaseOrderTotal(data.items);
    await updateDoc(doc(bizPurchaseOrdersCol(bid), id), stripUndefined(patch));
  };

  // Receiving = the single point where supplier stock moves in. Transactional
  // mirror image of order acceptance; idempotent via stockAdjusted.
  const receivePurchaseOrder = async (po: PurchaseOrder) => {
    if (po.stockAdjusted) return;
    const incoming = new Map<string, number>();
    for (const i of po.items) incoming.set(i.productId, (incoming.get(i.productId) ?? 0) + i.quantity);
    await runTransaction(db, async tx => {
      const refs = [...incoming.keys()].map(pid => doc(bizProductsCol(bid), pid));
      const snaps = await Promise.all(refs.map(r => tx.get(r)));
      const now = Date.now();
      snaps.forEach((s, i) => {
        if (!s.exists()) return; // product deleted since ordering — skip
        tx.update(refs[i], { stockQty: (s.data() as Product).stockQty + incoming.get(refs[i].id)!, updatedAt: now });
      });
      tx.update(doc(bizPurchaseOrdersCol(bid), po.id), {
        status: 'received', receivedAt: now, stockAdjusted: true, updatedAt: now,
      });
    });
    void refreshCatalogStock(bid, [...incoming.keys()]);
  };

  const deletePurchaseOrder = async (id: string) => { await deleteDoc(doc(bizPurchaseOrdersCol(bid), id)); };

  return { purchaseOrders, loading, createPurchaseOrder, updatePurchaseOrder, receivePurchaseOrder, deletePurchaseOrder };
}

// ─── Boarding & daycare ───────────────────────────────────────────────────────

// Recompute the public "full dates" window (next 90 days at capacity) so the
// stay-request page can grey out unavailable dates. Analog of refreshBusySlots:
// best-effort, merge-written, never exposes raw capacity or occupancy counts.
const BOARDING_WINDOW_DAYS = 90;

export async function refreshBoardingAvailability(bid: string) {
  try {
    const bizSnap = await getDoc(doc(businessesCol(), bid));
    if (!bizSnap.exists()) return;
    const biz = bizSnap.data() as Business;
    if (!biz.boarding) return;
    const today = todayStr();
    const snap = await getDocs(query(bizStaysCol(bid), where('endDate', '>=', today)));
    const stays = snap.docs.map(d => d.data() as Stay);
    const full = fullDates(stays, biz.boarding.capacity, today, BOARDING_WINDOW_DAYS);
    await setDoc(doc(businessDirectoryCol(), bid),
      { boarding: { fullDates: full }, updatedAt: Date.now() }, { merge: true });
  } catch { /* directory may not exist for unlisted businesses — ignore */ }
}

export function useStays(bid: string) {
  const { user } = useAuth();
  const { items: stays, loading } = useCollection<Stay>(
    () => (bid ? bizStaysCol(bid) : null), [bid], [orderBy('startDate', 'asc')],
  );

  const createStay = async (data: Omit<Stay, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'source'>) => {
    const now = Date.now();
    const ref = await addDoc(bizStaysCol(bid), stripUndefined({
      ...data, source: 'staff', createdBy: user!.uid, createdAt: now, updatedAt: now,
    } as Stay));
    void refreshBoardingAvailability(bid);
    return ref;
  };

  const updateStay = async (id: string, data: Partial<Stay>) => {
    await updateDoc(doc(bizStaysCol(bid), id), stripUndefined({ ...data, updatedAt: Date.now() }));
    void refreshBoardingAvailability(bid);
  };

  // Approving (or directly checking in) is the capacity gate: the stay only
  // starts occupying a space if every night still fits.
  const setStayStatus = async (stay: Stay, status: StayStatus, capacity: number): Promise<{ ok: boolean; reason?: string }> => {
    const takesSpace = (status === 'approved' || status === 'checked_in') &&
      stay.status !== 'approved' && stay.status !== 'checked_in';
    if (takesSpace) {
      const others = stays.filter(s => s.id !== stay.id);
      if (!hasCapacityForRange(others, capacity, stay.startDate, stay.endDate)) {
        return { ok: false, reason: 'No free space for part of this date range.' };
      }
    }
    await updateStay(stay.id, { status });
    const STAY_STATUS_MESSAGES: Partial<Record<StayStatus, string>> = {
      approved: `${stay.petName}'s stay (${stay.startDate} → ${stay.endDate}) was approved. See you then!`,
      declined: `${stay.petName}'s stay request was declined.`,
      checked_in: `${stay.petName} checked in. We'll take good care of them!`,
      checked_out: `${stay.petName} checked out. Thanks for staying with us!`,
    };
    const text = STAY_STATUS_MESSAGES[status];
    if (text) void postSystemMessage(bid, { userId: stay.customerUserId, name: stay.customerName }, text);
    return { ok: true };
  };

  const addDailyNote = async (id: string, text: string) => {
    const note: StayDailyNote = {
      at: Date.now(), byUserId: user!.uid, byName: user!.displayName ?? 'Staff', text,
    };
    await updateDoc(doc(bizStaysCol(bid), id), { dailyNotes: arrayUnion(note), updatedAt: Date.now() });
  };

  const deleteStay = async (id: string) => {
    await deleteDoc(doc(bizStaysCol(bid), id));
    void refreshBoardingAvailability(bid);
  };

  return { stays, loading, createStay, updateStay, setStayStatus, addDailyNote, deleteStay };
}

// ─── small local helpers ──────────────────────────────────────────────────────
function arrayUnionCompat(v: string) { return arrayUnion(v); }
function arrayRemoveCompat(v: string) { return arrayRemove(v); }
