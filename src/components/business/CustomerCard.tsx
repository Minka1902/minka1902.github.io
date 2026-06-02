import { ChevronDown, Mail, Pencil, PawPrint, Phone, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { usePets } from '@/hooks/useBusiness';
import type { BusinessCustomer, BusinessPet } from '@/types';

interface Props {
  customer: BusinessCustomer;
  bid: string;
  expanded: boolean;
  canManage: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddPet: () => void;
  onEditPet: (pet: BusinessPet) => void;
  onDeletePet: (pet: BusinessPet) => void;
}

export default function CustomerCard({
  customer, bid, expanded, canManage, onToggle, onEdit, onDelete, onAddPet, onEditPet, onDeletePet,
}: Props) {
  const { pets, loading } = usePets(expanded ? bid : '', customer.id);

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{customer.name}</p>
              <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                {customer.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{customer.email}</span>}
                {customer.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</span>}
              </div>
            </div>
          </button>
          {canManage && (
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit customer"><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Delete customer"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          )}
        </div>

        {expanded && (
          <div className="mt-3 space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pets</p>
              {canManage && (
                <Button variant="outline" size="sm" onClick={onAddPet} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add pet</Button>
              )}
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : pets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pets yet.</p>
            ) : (
              pets.map(pet => (
                <div key={pet.id} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                  <PawPrint className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{pet.name}</p>
                    <p className="truncate text-xs capitalize text-muted-foreground">
                      {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => onEditPet(pet)} aria-label="Edit pet"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => onDeletePet(pet)} aria-label="Delete pet"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
