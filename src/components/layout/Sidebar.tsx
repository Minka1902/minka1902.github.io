import { NavLink } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDog } from '@/contexts/DogContext';
import { SIDEBAR_NAV } from '@/lib/nav';

interface SidebarContentProps {
  onClose?: () => void;
}

export function SidebarContent({ onClose }: SidebarContentProps) {
  const { activeDog } = useDog();

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--sidebar)', color: 'var(--sidebar-foreground)' }}>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
            style={{ backgroundColor: 'var(--sidebar-primary)', color: 'var(--sidebar-primary-foreground)' }}
          >
            <PawPrint className="h-4 w-4" />
          </div>
          <span
            className="text-xl tracking-tight"
            style={{
              fontFamily: 'var(--font-heading)',
              fontVariationSettings: "'SOFT' 0, 'WONK' 0",
              color: 'var(--sidebar-foreground)',
            }}
          >
            PackOps
          </span>
        </div>

        {/* Active dog chip */}
        {activeDog && (
          <div
            className="mt-4 px-3 py-2 rounded-md"
            style={{ backgroundColor: 'var(--sidebar-accent)' }}
          >
            <p className="text-xs uppercase tracking-widest opacity-50 mb-0.5">Active dog</p>
            <p className="text-sm font-semibold capitalize truncate" style={{ color: 'var(--sidebar-primary)' }}>
              {activeDog.name}
            </p>
            {activeDog.breed && (
              <p className="text-xs opacity-50 truncate">{activeDog.breed}{activeDog.isMix ? ' mix' : ''}</p>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-5 border-t" style={{ borderColor: 'var(--sidebar-border)' }} />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {SIDEBAR_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150',
                isActive
                  ? 'font-semibold'
                  : 'opacity-60 hover:opacity-90',
              )
            }
            style={({ isActive }) => isActive
              ? { backgroundColor: 'var(--sidebar-primary)', color: 'var(--sidebar-primary-foreground)' }
              : { color: 'var(--sidebar-foreground)' }
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-4 w-4 shrink-0" />
                {label}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--sidebar-primary-foreground)', opacity: 0.5 }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom wordmark */}
      <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
        <p className="text-xs opacity-30 tracking-widest uppercase">Rescue · Care · Ops</p>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col">
      <SidebarContent />
    </aside>
  );
}
