import { useEffect, useState } from 'react';
import { addDoc, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import {
  businessDirectoryCol, bizAppointmentsCol, bizOrdersCol, bizStaysCol, directoryCatalogCol,
} from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { stripUndefined } from '@/lib/utils';
import { distanceKm } from '@/lib/geo';
import { computeOrderTotals } from '@/types';
import type {
  BusinessAddress, BusinessDirectoryEntry, FulfillmentMethod, GeoPoint, OrderItem,
  OrderPaymentMethod, PublicCatalogItem, StayFoodPlan, StayMedication,
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
export function usePlaceOrder() {
  const { user } = useAuth();

  const placeOrder = async (bid: string, entry: BusinessDirectoryEntry, input: PlaceOrderInput) => {
    const now = Date.now();
    const deliveryFee = input.fulfillment === 'delivery' ? (entry.deliveryFee ?? 0) : 0;
    const { subtotal, total } = computeOrderTotals(input.items, deliveryFee);
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

  const requestStay = async (bid: string, input: StayRequestInput) => {
    const now = Date.now();
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
