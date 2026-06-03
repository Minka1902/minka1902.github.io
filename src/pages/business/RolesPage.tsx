import { useState } from 'react';
import { Lock, Pencil, Plus, Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBusiness, useBusinessRoles } from '@/hooks/useBusiness';
import { usePermissions } from '@/hooks/usePermissions';
import RoleEditor from '@/components/business/RoleEditor';
import type { BusinessRole, Capability } from '@/types';

export default function RolesPage() {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();
  const bid = activeBusiness?.id ?? '';
  const { roles, loading, createRole, updateRole, deleteRole } = useBusinessRoles(bid);

  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<BusinessRole | null>(null);

  const canManage = can('manage_roles');

  if (!activeBusiness) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">No business selected.</div>;
  }
  if (!canManage) {
    return <div className="mx-auto max-w-2xl py-14 text-center text-sm text-muted-foreground">You don't have access to roles.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:flex-1 lg:overflow-y-auto lg:p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Roles</h1>
        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> New role
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {roles.map(role => (
            <Card key={role.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {role.isSystem ? <Lock className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{role.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {role.capabilities.length} {role.capabilities.length === 1 ? 'capability' : 'capabilities'}
                    {role.isSystem ? ' · system' : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditRole(role)} aria-label="Edit role">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {!role.isSystem && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => { if (confirm(`Delete role "${role.name}"?`)) deleteRole(role.id); }}
                      aria-label="Delete role"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create */}
      <RoleEditor
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={async (name: string, caps: Capability[]) => { await createRole(name, caps); }}
      />

      {/* Edit */}
      <RoleEditor
        role={editRole ?? undefined}
        open={!!editRole}
        onOpenChange={o => { if (!o) setEditRole(null); }}
        onSave={async (name: string, caps: Capability[]) => {
          if (editRole) await updateRole(editRole.id, { name, capabilities: caps });
        }}
      />
    </div>
  );
}
