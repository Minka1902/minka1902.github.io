import type { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import type { Capability } from '@/types';

interface Props {
  cap: Capability;
  children: ReactNode;
  fallback?: ReactNode;
}

/** Renders children only when the current user has `cap` in the active business. */
export default function PermissionGate({ cap, children, fallback }: Props) {
  const { can } = usePermissions();
  if (!can(cap)) return <>{fallback ?? null}</>;
  return <>{children}</>;
}
