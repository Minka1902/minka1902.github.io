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
    <>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <PawPrint className="h-4 w-4" />
        </div>
        <span className="font-bold text-lg tracking-tight">PackOps</span>
      </div>

      {/* Active dog context */}
      {activeDog && (
        <div className="px-4 py-3 border-b bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Active dog</p>
          <p className="text-sm font-semibold truncate capitalize">{activeDog.name}</p>
          {activeDog.breed && (
            <p className="text-xs text-muted-foreground truncate">{activeDog.breed}</p>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {SIDEBAR_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 border-r bg-background flex-col">
      <SidebarContent />
    </aside>
  );
}
