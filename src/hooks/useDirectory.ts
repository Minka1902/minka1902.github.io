import { useEffect, useState } from 'react';
import {
  addDoc, collectionGroup, doc, getDoc, increment, onSnapshot, orderBy, query,
  setDoc, updateDoc, where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  businessDirectoryCol, bizAppointmentsCol, bizCustomerPackagesCol, bizOrdersCol,
  bizStaysCol, bizThreadsCol, bizThreadMessagesCol, directoryCatalogCol, directoryReviewsCol,
} from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { stripUndefined } from '@/lib/utils';
import { distanceKm } from '@/lib/geo';
import { computeOrderTotals } from '@/types';
import type {
  BusinessAddress, BusinessDirectoryEntry, BusinessReview, CustomerPackage, FulfillmentMethod,
  GeoPoint, MessageThread, OrderItem, OrderPaymentMethod, PublicCatalogItem, PublicPackageItem,
  StayFoodPlan, StayMedication, ThreadMessage,
} from '@/types';

export interface DirectoryResult extends BusinessDirectoryEntry {
  distance?: number; // km from the search origin, when both have coordinates
}

/**
 * Public business directory for "businesses near me". Reads the openly-readable
 * `businessDirectory` projection and, when an origin is provided, annotates and
 * sorts results by distance. Businesses without coordinates sort to the end.
 */
export function useBusinessDirectory(origin: GeoPoint | null) {
  const [entries, setEntries] = useState<BusinessDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      businessDirectoryCol(),
      snap => {
        setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as BusinessDirectoryEntry)));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  const results: DirectoryResult[] = entries
    .map(e => ({
      ...e,
      distance: origin && e.location ? distanceKm(origin, e.location) : undefined,
    }))
    .sort((a, b) => {
      if (a.distance == null && b.distance == null) return a.name.localeCompare(b.name);
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });

  return { results, loading };
}

/** Read a single public directory entry (used by the booking page). */
export function useDirectoryEntry(bid: string | undefined) {
  const [entry, setEntry] = useState<BusinessDirectoryEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bid) { setEntry(null); setLoading(false); return; }
    setLoading(true);
    getDoc(doc(businessDirectoryCol(), bid))
      .then(snap => setEntry(snap.exists() ? ({ id: snap.id, ...snap.data() } as BusinessDirectoryEntry) : null))
      .catch(() => setEntry(null))
      .finally(() => setLoading(false));
  }, [bid]);

  return { entry, loading };
}

export interface BookingInput {
  serviceLabel: string;
  startAt: number;
  endAt: number;
  petName?: string;
  notes?: string;
}

/**
 * Customer self-booking. Any signed-in user can request an appointment at a
 * bookable business; it lands in the business's appointment list as a
 * customer-sourced, "scheduled" request for staff to confirm. Firestore rules
 * constrain the shape of what a non-staff user may write.
 */
export function useBooking() {
  const { user } = useAuth();

  const book = async (bid: string, input: BookingInput) => {
    const now = Date.now();
    return addDoc(bizAppointmentsCol(bid), stripUndefined({
      customerName: user!.displayName,
      customerUserId: user!.uid,
      customerEmail: user!.email,
      customerPhone: user!.phoneNumber,
      petName: input.petName,
      serviceLabel: input.serviceLabel,
      startAt: input.startAt,
      endAt: input.endAt,
      status: 'scheduled' as const,
      source: 'customer' as const,
      notes: input.notes,
      createdBy: user!.uid,
      createdAt: now,
      updatedAt: now,
    }));
  };

  return { book };
}

/**
 * Public product catalog of an ordering-enabled business. The projection only
 * exposes name / category / price / inStock — never raw stock numbers.
 */
export function usePublicCatalog(bid: string | undefined) {
  const [items, setItems] = useState<PublicCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bid) { setItems([]); setLoading(false); return; }
    const unsub = onSnapshot(
      query(directoryCatalogCol(bid), orderBy('name', 'asc')),
      snap => {
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as PublicCatalogItem)));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [bid]);

  return { items, loading };
}

export interface PlaceOrderInput {
  items: OrderItem[];
  fulfillment: FulfillmentMethod;
  deliveryAddress?: BusinessAddress;
  paymentMethod: OrderPaymentMethod;
  notes?: string;
}

/**
 * Customer self-order. Lands as a customer-sourced "placed" order for staff to
 * accept; stock only moves at acceptance. Firestore rules constrain the shape
 * (unpaid, own uid) — even "pay online" orders start unpaid and are reconciled
 * by staff, since payment is record-only today.
 */
// Best-effort thread opener so the conversation exists from the first order or
// stay request — staff replies and status updates land in the same place.
async function openThread(bid: string, businessName: string, user: { uid: string; displayName: string | null }, text: string) {
  try {
    const now = Date.now();
    await setDoc(doc(bizThreadsCol(bid), user.uid), {
      customerUserId: user.uid,
      customerName: user.displayName ?? 'Customer',
      businessId: bid,
      businessName,
      lastMessageAt: now,
      lastMessageText: text,
      unreadByStaff: increment(1),
      updatedAt: now,
    }, { merge: true });
    await addDoc(bizThreadMessagesCol(bid, user.uid), {
      at: now, fromUserId: user.uid, fromName: user.displayName ?? 'Customer',
      fromSide: 'customer', kind: 'system', text,
    } satisfies Omit<ThreadMessage, 'id'>);
  } catch { /* messaging rides on top of the real write */ }
}

export function usePlaceOrder() {
  const { user } = useAuth();

  const placeOrder = async (bid: string, entry: BusinessDirectoryEntry, input: PlaceOrderInput) => {
    const now = Date.now();
    const deliveryFee = input.fulfillment === 'delivery' ? (entry.deliveryFee ?? 0) : 0;
    const { subtotal, total } = computeOrderTotals(input.items, deliveryFee);
    const itemCount = input.items.reduce((s, i) => s + i.quantity, 0);
    void openThread(bid, entry.name, user!,
      `Order placed: ${itemCount} item${itemCount !== 1 ? 's' : ''}, total ${total.toFixed(2)} ${entry.currency ?? ''}.`);
    return addDoc(bizOrdersCol(bid), stripUndefined({
      items: input.items,
      customerUserId: user!.uid,
      customerName: user!.displayName,
      customerEmail: user!.email,
      customerPhone: user!.phoneNumber,
      fulfillment: input.fulfillment,
      deliveryAddress: input.deliveryAddress,
      deliveryFee: deliveryFee || undefined,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'unpaid' as const,
      subtotal, total,
      status: 'placed' as const,
      source: 'customer' as const,
      notes: input.notes,
      createdBy: user!.uid,
      createdAt: now,
      updatedAt: now,
    }));
  };

  return { placeOrder };
}

// ─── Customer messaging ───────────────────────────────────────────────────────
// Thread doc id == the customer's uid inside each business. Customers find all
// their threads across businesses with one collection-group query.

/** All message threads belonging to the signed-in user, newest first. */
export function useMyThreads() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setThreads([]); setLoading(false); return; }
    const unsub = onSnapshot(
      query(collectionGroup(db, 'threads'),
        where('customerUserId', '==', user.uid), orderBy('lastMessageAt', 'desc')),
      snap => {
        setThreads(snap.docs.map(d => ({ id: d.id, ...d.data() } as MessageThread)));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [user]);

  return { threads, loading };
}

/** Live messages of one thread (works for the thread's customer by rules). */
export function useCustomerThreadMessages(bid: string | null, tid: string | null) {
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

export function useCustomerMessaging() {
  const { user } = useAuth();

  // Create-or-bump the user's thread at a business and append a message. Used
  // for chat replies and for the "order placed" style openers.
  const sendToBusiness = async (
    bid: string,
    businessName: string,
    text: string,
    kind: 'chat' | 'system' = 'chat',
  ) => {
    const now = Date.now();
    await setDoc(doc(bizThreadsCol(bid), user!.uid), {
      customerUserId: user!.uid,
      customerName: user!.displayName ?? 'Customer',
      businessId: bid,
      businessName,
      lastMessageAt: now,
      lastMessageText: text,
      unreadByStaff: increment(1),
      updatedAt: now,
    }, { merge: true });
    await addDoc(bizThreadMessagesCol(bid, user!.uid), {
      at: now, fromUserId: user!.uid, fromName: user!.displayName ?? 'Customer',
      fromSide: 'customer', kind, text,
    } satisfies Omit<ThreadMessage, 'id'>);
  };

  const markReadByCustomer = async (bid: string) => {
    await updateDoc(doc(bizThreadsCol(bid), user!.uid), { unreadByCustomer: 0 }).catch(() => undefined);
  };

  return { sendToBusiness, markReadByCustomer };
}

/**
 * Customer package self-purchase (record-only payment — the business reconciles
 * actual payment). Rules require own uid and full credits at creation.
 */
export function usePurchasePackage() {
  const { user } = useAuth();

  const purchasePackage = async (bid: string, entry: BusinessDirectoryEntry, item: PublicPackageItem) => {
    const now = Date.now();
    void openThread(bid, entry.name, user!,
      `Purchased package "${item.name}" (${item.credits} credits, ${item.price.toFixed(2)} ${entry.currency ?? ''}).`);
    return addDoc(bizCustomerPackagesCol(bid), stripUndefined({
      packageId: item.id,
      name: item.name,
      creditType: item.creditType,
      customerUserId: user!.uid,
      customerName: user!.displayName ?? 'Customer',
      creditsTotal: item.credits,
      creditsRemaining: item.credits,
      expiresAt: item.validityDays ? now + item.validityDays * 24 * 60 * 60 * 1000 : undefined,
      status: 'active',
      createdAt: now, updatedAt: now,
    } as CustomerPackage));
  };

  return { purchasePackage };
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
// One review per user (doc id == reviewer uid). The aggregate on the directory
// entry is best-effort, merge-written by the reviewing client; the detail page
// always computes the exact numbers from the subcollection it just read.

export function useReviews(bid: string | undefined) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<(BusinessReview & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bid) { setReviews([]); setLoading(false); return; }
    const unsub = onSnapshot(
      query(directoryReviewsCol(bid), orderBy('updatedAt', 'desc')),
      snap => {
        setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as BusinessReview & { id: string })));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [bid]);

  const myReview = user ? reviews.find(r => r.id === user.uid) ?? null : null;

  const submitReview = async (rating: number, text?: string) => {
    if (!bid || !user) return;
    await setDoc(doc(directoryReviewsCol(bid), user.uid), stripUndefined({
      rating,
      text: text?.trim() || undefined,
      authorName: user.displayName ?? 'PackOps user',
      updatedAt: Date.now(),
    } satisfies BusinessReview));
    // Refresh the aggregate from what this client can see (including its own
    // write, which the local listener already applied).
    const others = reviews.filter(r => r.id !== user.uid);
    const all = [...others, { id: user.uid, rating, text, authorName: '', updatedAt: Date.now() }];
    const ratingAvg = Math.round((all.reduce((s, r) => s + r.rating, 0) / all.length) * 10) / 10;
    await setDoc(doc(businessDirectoryCol(), bid),
      { ratingAvg, ratingCount: all.length, updatedAt: Date.now() }, { merge: true })
      .catch(() => undefined);
  };

  return { reviews, loading, myReview, submitReview };
}

export interface StayRequestInput {
  petName: string;
  petSpecies?: 'dog' | 'cat' | 'other';
  startDate: string;           // 'YYYY-MM-DD'
  endDate: string;
  foodPlan?: StayFoodPlan;
  medications?: StayMedication[];
  careInstructions?: string;
}

/**
 * Customer stay request (boarding/daycare). Lands as a "requested" stay the
 * business must approve — capacity is enforced at approval time.
 */
export function useRequestStay() {
  const { user } = useAuth();

  const requestStay = async (bid: string, entry: BusinessDirectoryEntry, input: StayRequestInput) => {
    const now = Date.now();
    void openThread(bid, entry.name, user!,
      `Stay requested for ${input.petName}: ${input.startDate} → ${input.endDate}.`);
    return addDoc(bizStaysCol(bid), stripUndefined({
      customerUserId: user!.uid,
      customerName: user!.displayName,
      customerEmail: user!.email,
      customerPhone: user!.phoneNumber,
      petName: input.petName,
      petSpecies: input.petSpecies,
      startDate: input.startDate,
      endDate: input.endDate,
      status: 'requested' as const,
      source: 'customer' as const,
      foodPlan: input.foodPlan,
      medications: input.medications,
      careInstructions: input.careInstructions,
      createdBy: user!.uid,
      createdAt: now,
      updatedAt: now,
    }));
  };

  return { requestStay };
}
