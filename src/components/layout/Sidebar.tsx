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

      {/* ── Brand ── */}
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 relative overflow-hidden"
            style={{ backgroundColor: 'var(--sidebar-primary)' }}
          >
            <PawPrint className="h-4 w-4 relative z-10" style={{ color: 'var(--sidebar-primary-foreground)' }} />
          </div>
          <span
            className="text-xl tracking-tight"
            style={{
              fontFamily: 'var(--font-heading)',
              fontVariationSettings: "'SOFT' 0, 'WONK' 0",
              color: 'var(--sidebar-foreground)',
              letterSpacing: '-0.02em',
            }}
          >
            PackOps
          </span>
        </div>

        {/* ── Active dog identity block ── */}
        {activeDog && (
          <div className="mt-5 relative">
            <div
              className="rounded-xl px-3.5 py-3 relative overflow-hidden"
              style={{ backgroundColor: 'var(--sidebar-accent)' }}
            >
              {/* Subtle left accent stripe */}
              <div
                className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
                style={{ backgroundColor: 'var(--sidebar-primary)' }}
              />
              <p className="text-[9px] uppercase tracking-[0.12em] mb-1" style={{ color: 'oklch(1 0 0 / 30%)' }}>
                Active
              </p>
              <p
                className="text-sm font-semibold capitalize leading-tight"
                style={{ color: 'var(--sidebar-primary)', fontFamily: 'var(--font-heading)', fontVariationSettings: "'SOFT' 0" }}
              >
                {activeDog.name}
              </p>
              {activeDog.breed && (
                <p className="text-[11px] mt-0.5 leading-tight" style={{ color: 'oklch(1 0 0 / 38%)' }}>
                  {activeDog.breed}{activeDog.isMix ? ' mix' : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="mx-5" style={{ height: '1px', backgroundColor: 'var(--sidebar-border)' }} />

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {SIDEBAR_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                isActive ? 'font-semibold' : 'hover:opacity-90',
              )
            }
            style={({ isActive }) => isActive
              ? {
                  backgroundColor: 'var(--sidebar-primary)',
                  color: 'var(--sidebar-primary-foreground)',
                  boxShadow: '0 1px 3px oklch(0 0 0 / 0.3), 0 0 0 1px oklch(0.72 0.158 50 / 0.2)',
                }
              : { color: 'oklch(1 0 0 / 55%)' }
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: 'oklch(0.14 0.014 50 / 0.6)' }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom wordmark ── */}
      <div className="px-5 py-5" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center gap-2">
          <div className="h-px flex-1" style={{ backgroundColor: 'oklch(1 0 0 / 8%)' }} />
          <p className="text-[9px] uppercase tracking-[0.14em]" style={{ color: 'oklch(1 0 0 / 22%)' }}>
            Rescue · Care · Ops
          </p>
          <div className="h-px flex-1" style={{ backgroundColor: 'oklch(1 0 0 / 8%)' }} />
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside
      className="hidden lg:flex w-60 shrink-0 flex-col"
      style={{
        boxShadow: '1px 0 0 0 oklch(0.5 0 0 / 0.08), 2px 0 8px -2px oklch(0 0 0 / 0.08)',
      }}
    >
      <SidebarContent />
    </aside>
  );
}
