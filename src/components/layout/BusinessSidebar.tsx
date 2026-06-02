import { NavLink } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/contexts/BusinessContext';
import { usePermissions } from '@/hooks/usePermissions';
import { BUSINESS_NAV_ITEMS } from '@/lib/nav';

export function BusinessSidebarContent({ onClose }: { onClose?: () => void }) {
  const { activeBusiness } = useBusiness();
  const { can } = usePermissions();

  const items = BUSINESS_NAV_ITEMS.filter(item => !item.cap || can(item.cap));

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--sidebar)', color: 'var(--sidebar-foreground)' }}>
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
            style={{ backgroundColor: 'var(--sidebar-primary)' }}
          >
            <Briefcase className="h-4 w-4" style={{ color: 'var(--sidebar-primary-foreground)' }} />
          </div>
          <span
            className="text-xl tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--sidebar-foreground)', letterSpacing: '-0.02em' }}
          >
            PackOps
          </span>
        </div>

        {activeBusiness && (
          <div className="mt-5">
            <div className="rounded-xl px-3.5 py-3 relative overflow-hidden" style={{ backgroundColor: 'var(--sidebar-accent)' }}>
              <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" style={{ backgroundColor: 'var(--sidebar-primary)' }} />
              <p className="text-[9px] uppercase tracking-[0.12em] mb-1" style={{ color: 'oklch(1 0 0 / 30%)' }}>Business</p>
              <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--sidebar-primary)', fontFamily: 'var(--font-heading)' }}>
                {activeBusiness.name}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mx-5" style={{ height: '1px', backgroundColor: 'var(--sidebar-border)' }} />

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/business'}
            onClick={onClose}
            className={({ isActive }) =>
              cn('group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                isActive ? 'font-semibold' : 'hover:opacity-90')
            }
            style={({ isActive }) => isActive
              ? { backgroundColor: 'var(--sidebar-primary)', color: 'var(--sidebar-primary-foreground)' }
              : { color: 'oklch(1 0 0 / 55%)' }}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.9} />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-5" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <p className="text-[9px] uppercase tracking-[0.14em] text-center" style={{ color: 'oklch(1 0 0 / 22%)' }}>
          Business · CRM
        </p>
      </div>
    </div>
  );
}

export default function BusinessSidebar() {
  return (
    <aside
      className="hidden lg:flex w-60 shrink-0 flex-col"
      style={{ boxShadow: '1px 0 0 0 oklch(0.5 0 0 / 0.08), 2px 0 8px -2px oklch(0 0 0 / 0.08)' }}
    >
      <BusinessSidebarContent />
    </aside>
  );
}
