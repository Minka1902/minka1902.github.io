import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOrg } from '@/contexts/OrgContext';
import OrgCard from '@/components/org/OrgCard';
import { searchOrgs } from '@/hooks/useOrg';
import { useOrgPendingMembers } from '@/hooks/useOrg';
import { useAuth } from '@/hooks/useAuth';
import type { Organization } from '@/types';

function JoinButton({ org }: { org: Organization }) {
  const { user } = useAuth();
  const { requestJoin } = useOrgPendingMembers(org.id);
  const { orgs } = useOrg();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const alreadyMember = orgs.some(o => o.id === org.id);
  const alreadyAdmin = org.adminUserIds.includes(user?.uid ?? '');

  if (alreadyMember || alreadyAdmin) {
    return <span className="text-xs text-muted-foreground">Already a member</span>;
  }

  const handleJoin = async () => {
    setStatus('loading');
    try {
      await requestJoin(org.id);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'done') return <span className="text-xs text-green-600">Request sent!</span>;
  if (status === 'error') return <span className="text-xs text-destructive">Failed to send request.</span>;

  return (
    <Button size="sm" onClick={handleJoin} disabled={status === 'loading'}>
      {status === 'loading' ? 'Sending…' : 'Request to Join'}
    </Button>
  );
}

export default function JoinOrgPage() {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<Organization[] | null>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim()) return;
    setSearching(true);
    const found = await searchOrgs(term.trim());
    setResults(found);
    setSearching(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Find Organization</h1>

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search by organization name…"
              value={term}
              onChange={e => { setTerm(e.target.value); setResults(null); }}
              autoComplete="off"
              className="flex-1"
            />
            <Button type="submit" variant="outline" size="icon" disabled={searching} aria-label="Search">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {results !== null && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No organizations found matching "{term}".</p>
          ) : (
            results.map(org => (
              <div key={org.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <OrgCard org={org} />
                </div>
                <div className="shrink-0">
                  <JoinButton org={org} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
