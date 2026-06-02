import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBusiness, useCustomers, usePets } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import CustomerCard from '@/components/business/CustomerCard';
import CustomerForm, { type CustomerFormData } from '@/components/business/CustomerForm';
import PetForm, { type PetFormData } from '@/components/business/PetForm';
import type { BusinessCustomer, BusinessPet } from '@/types';

// Pets mutations need a hook bound to the active business; provide a wrapper.
function PetDialog({ bid, customerId, pet, open, onClose }: {
  bid: string; customerId: string; pet?: BusinessPet; open: boolean; onClose: () => void;
}) {
  const { createPet, updatePet } = usePets(bid, customerId);
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{pet ? 'Edit pet' : 'Add pet'}</DialogTitle></DialogHeader>
        <PetForm
          customerId={customerId}
          initial={pet}
          onSubmit={async (data: PetFormData) => {
            if (pet) await updatePet(pet.id, data);
            else await createPet(data);
            onClose();
          }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

export default function CustomersPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const { customers, loading, createCustomer, updateCustomer, deleteCustomer } = useCustomers(bid);
  const { deletePet } = usePets(bid);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<BusinessCustomer | null>(null);
  const [petDialog, setPetDialog] = useState<{ customerId: string; pet?: BusinessPet } | null>(null);

  const canManage = can('manage_customers');
  const canView = can('view_customers');

  if (!activeBusiness) {
    return <NoBusinessMsg />;
  }
  if (!canView && !canManage) {
    return <NoAccessMsg />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Customers</h1>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add customer
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-3 w-24" /></div>
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-background py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No customers yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add your first customer to get started.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map(c => (
            <CustomerCard
              key={c.id}
              customer={c}
              bid={bid}
              expanded={expandedId === c.id}
              canManage={canManage}
              onToggle={() => setExpandedId(prev => (prev === c.id ? null : c.id))}
              onEdit={() => setEditCustomer(c)}
              onDelete={() => { if (confirm(`Delete ${c.name}?`)) deleteCustomer(c.id); }}
              onAddPet={() => setPetDialog({ customerId: c.id })}
              onEditPet={(pet) => setPetDialog({ customerId: c.id, pet })}
              onDeletePet={(pet) => { if (confirm(`Delete ${pet.name}?`)) deletePet(pet.id); }}
            />
          ))}
        </div>
      )}

      {/* Add customer */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add customer</DialogTitle></DialogHeader>
          <CustomerForm
            onSubmit={async (data: CustomerFormData) => { await createCustomer(data); setAddOpen(false); }}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit customer */}
      <Dialog open={!!editCustomer} onOpenChange={o => { if (!o) setEditCustomer(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit customer</DialogTitle></DialogHeader>
          {editCustomer && (
            <CustomerForm
              initial={editCustomer}
              onSubmit={async (data: CustomerFormData) => { await updateCustomer(editCustomer.id, data); setEditCustomer(null); }}
              onCancel={() => setEditCustomer(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Pet add/edit */}
      {petDialog && (
        <PetDialog
          bid={bid}
          customerId={petDialog.customerId}
          pet={petDialog.pet}
          open={!!petDialog}
          onClose={() => setPetDialog(null)}
        />
      )}
    </div>
  );
}

// Local empty-state helpers (kept inline to avoid new shared files).
function NoBusinessMsg() {
  return (
    <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">
      No business selected. Create or select a business first.
    </div>
  );
}
function NoAccessMsg() {
  return (
    <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">
      You don't have access to customers.
    </div>
  );
}
