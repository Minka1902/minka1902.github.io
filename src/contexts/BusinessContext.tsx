import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from 'react';
import { query, where, onSnapshot, doc } from 'firebase/firestore';
import { businessesCol, bizStaffCol } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useSessionMode } from '@/contexts/SessionModeContext';
import type { Business, BusinessStaff } from '@/types';

const ACTIVE_BIZ_KEY = 'packops_active_business_id';

interface BusinessContextValue {
  businesses: Business[];
  activeBusiness: Business | null;
  setActiveBusiness: (biz: Business) => void;
  /** The current user's staff record for the active business (owner included). */
  myStaff: BusinessStaff | null;
  isOwner: boolean;
  loading: boolean;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { mode } = useSessionMode();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusinessState] = useState<Business | null>(null);
  const [myStaff, setMyStaff] = useState<BusinessStaff | null>(null);
  const [loading, setLoading] = useState(true);

  // Only open listeners while operating in business mode.
  useEffect(() => {
    if (!user || mode !== 'business') {
      setBusinesses([]);
      setActiveBusinessState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const storedId = localStorage.getItem(ACTIVE_BIZ_KEY);
    const unsub = onSnapshot(
      query(businessesCol(), where('staffUserIds', 'array-contains', user.uid)),
      snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Business));
        setBusinesses(list);
        setActiveBusinessState(prev => {
          if (prev && list.find(b => b.id === prev.id)) return list.find(b => b.id === prev.id)!;
          return list.find(b => b.id === storedId) ?? list[0] ?? null;
        });
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [user, mode]);

  // Track the current user's staff doc (capabilities) for the active business.
  useEffect(() => {
    if (!user || !activeBusiness) {
      setMyStaff(null);
      return;
    }
    const unsub = onSnapshot(
      doc(bizStaffCol(activeBusiness.id), user.uid),
      snap => setMyStaff(snap.exists() ? (snap.data() as BusinessStaff) : null),
      () => setMyStaff(null),
    );
    return () => unsub();
  }, [user, activeBusiness]);

  const setActiveBusiness = useCallback((biz: Business) => {
    setActiveBusinessState(biz);
    localStorage.setItem(ACTIVE_BIZ_KEY, biz.id);
  }, []);

  const isOwner = !!user && !!activeBusiness && activeBusiness.ownerUserId === user.uid;

  const value = useMemo(
    () => ({ businesses, activeBusiness, setActiveBusiness, myStaff, isOwner, loading }),
    [businesses, activeBusiness, setActiveBusiness, myStaff, isOwner, loading],
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be used within BusinessProvider');
  return ctx;
}
