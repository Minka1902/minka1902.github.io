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
  isOrgLeader: (orgId: string) => boolean;
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

    let leaderOrgs: Organization[] = [];
    let staffOrgs: Organization[] = [];

    const flush = (leader: Organization[], staff: Organization[]) => {
      const seen = new Set<string>();
      const combined = [...leader, ...staff].filter(o => {
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

    const leaderUnsub = onSnapshot(
      query(orgsCol(), where('leaderUserIds', 'array-contains', user.uid)),
      snap => {
        leaderOrgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Organization));
        flush(leaderOrgs, staffOrgs);
      }
    );

    const staffUnsub = onSnapshot(
      query(orgsCol(), where('staffUserIds', 'array-contains', user.uid)),
      snap => {
        staffOrgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Organization));
        flush(leaderOrgs, staffOrgs);
      }
    );

    return () => {
      leaderUnsub();
      staffUnsub();
    };
  }, [user]);

  const orgIds = useMemo(() => orgs.map(o => o.id), [orgs]);

  const isOrgLeader = (orgId: string) =>
    user ? (orgs.find(o => o.id === orgId)?.leaderUserIds.includes(user.uid) ?? false) : false;

  return (
    <OrgContext.Provider value={{ orgs, orgIds, activeOrg, setActiveOrg, isOrgLeader, loading }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
}
