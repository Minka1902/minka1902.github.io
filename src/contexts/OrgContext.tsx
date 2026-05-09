import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { query, where, onSnapshot } from 'firebase/firestore';
import { orgsCol } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import type { Organization } from '@/types';

interface OrgContextValue {
  orgs: Organization[];
  orgIds: string[];
  activeOrg: Organization | null;
  setActiveOrg: (org: Organization) => void;
  isOrgAdmin: (orgId: string) => boolean;
  loading: boolean;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrgs([]);
      setActiveOrg(null);
      setLoading(false);
      return;
    }

    let adminOrgs: Organization[] = [];
    let memberOrgs: Organization[] = [];

    const flush = (admin: Organization[], member: Organization[]) => {
      const seen = new Set<string>();
      const combined = [...admin, ...member].filter(o => {
        if (seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      });
      setOrgs(combined);
      setLoading(false);
      setActiveOrg(prev => {
        if (prev && combined.find(o => o.id === prev.id)) {
          return combined.find(o => o.id === prev.id)!;
        }
        return prev;
      });
    };

    const adminUnsub = onSnapshot(
      query(orgsCol(), where('adminUserIds', 'array-contains', user.uid)),
      snap => {
        adminOrgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Organization));
        flush(adminOrgs, memberOrgs);
      }
    );

    const memberUnsub = onSnapshot(
      query(orgsCol(), where('memberUserIds', 'array-contains', user.uid)),
      snap => {
        memberOrgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Organization));
        flush(adminOrgs, memberOrgs);
      }
    );

    return () => {
      adminUnsub();
      memberUnsub();
    };
  }, [user]);

  const orgIds = useMemo(() => orgs.map(o => o.id), [orgs]);

  const isOrgAdmin = (orgId: string) =>
    user ? (orgs.find(o => o.id === orgId)?.adminUserIds.includes(user.uid) ?? false) : false;

  return (
    <OrgContext.Provider value={{ orgs, orgIds, activeOrg, setActiveOrg, isOrgAdmin, loading }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
}
