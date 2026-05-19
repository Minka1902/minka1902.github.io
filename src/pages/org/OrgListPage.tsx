import { Link } from 'react-router-dom';
import { Building2, Plus, Search } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { useOrg } from '@/contexts/OrgContext';
import OrgCard from '@/components/org/OrgCard';
import { cn } from '@/lib/utils';

export default function OrgListPage() {
  const { orgs, isOrgLeader } = useOrg();

  return (
    <div className="max-w-2xl mx-auto space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Organizations</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/orgs/join"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
          >
            <Search className="h-3.5 w-3.5" />
            Find & Join
          </Link>
          <Link
            to="/orgs/new"
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
          >
            <Plus className="h-3.5 w-3.5" />
            New Org
          </Link>
        </div>
      </div>

      {orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed bg-background gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium text-sm">No organizations yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create one or join an existing organization to manage dogs as a team.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Link to="/orgs/new" className={cn(buttonVariants({ size: 'sm' }))}>
              Create Organization
            </Link>
            <Link to="/orgs/join" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              Find Organization
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orgs.map(org => (
            <OrgCard key={org.id} org={org} isAdmin={isOrgLeader(org.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
