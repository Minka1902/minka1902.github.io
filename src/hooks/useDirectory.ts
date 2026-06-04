import { useEffect, useState } from 'react';
import { addDoc, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { businessDirectoryCol, bizAppointmentsCol } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { stripUndefined } from '@/lib/utils';
import { distanceKm } from '@/lib/geo';
import type { BusinessDirectoryEntry, GeoPoint } from '@/types';

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
