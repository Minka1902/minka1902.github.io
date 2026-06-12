import { Link } from 'react-router-dom';
import { ChevronRight, Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBusiness, useCustomers, usePets } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';

// Patient index: every pet on file, linking into its chart.
export default function PatientsPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const { pets, loading } = usePets(bid);
  const { customers } = useCustomers(bid);

  const canView = can('view_patients');
  const canManage = can('manage_patients');

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canView && !canManage) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to patient charts.</div>;
  }

  const customerName = (id: string) => customers.find(c => c.id === id)?.name ?? 'Unknown customer';

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Patients</h1>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
      ) : pets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Stethoscope className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No patients</p>
            <p className="mt-1 text-sm text-muted-foreground">Add pets under Customers — they show up here as patients.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {pets.map(pet => (
            <Link
              key={pet.id}
              to={`/business/patients/${pet.id}`}
              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors hover:bg-muted"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium">
                  {pet.name}
                  <Badge variant="secondary">{pet.species}</Badge>
                  {pet.linkedDogId && <Badge variant="outline">Linked to PackOps</Badge>}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {customerName(pet.customerId)}{pet.breed ? ` · ${pet.breed}` : ''}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
