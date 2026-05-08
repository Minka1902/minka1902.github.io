import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/nav';
import { useNavConfig } from '@/hooks/useNavConfig';

export default function BottomNav() {
  const { selected } = useNavConfig();
  const items = selected
    .map(to => NAV_ITEMS.find(n => n.to === to))
    .filter(Boolean) as typeof NAV_ITEMS;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch"
      style={{
        height: 68,
        backgroundColor: 'oklch(var(--background-raw, 0.972 0.008 72) / 0.88)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid oklch(0.5 0 0 / 0.08)',
        boxShadow: '0 -1px 0 0 oklch(0.5 0 0 / 0.06), 0 -8px 24px -4px oklch(0 0 0 / 0.06)',
      }}
    >
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all"
        >
          {({ isActive }) => (
            <>
              {/* Pill indicator */}
              {isActive && (
                <span
                  className="absolute top-2 h-1 w-8 rounded-full"
                  style={{ backgroundColor: 'var(--primary)' }}
                />
              )}
              <Icon
                className={cn('h-5 w-5 transition-all', isActive ? 'scale-110' : 'scale-100')}
                style={{ color: isActive ? 'var(--primary)' : 'oklch(0.5 0 0)', strokeWidth: isActive ? 2.2 : 1.7 }}
              />
              <span
                className="text-[10px] font-semibold tracking-wide transition-colors"
                style={{ color: isActive ? 'var(--primary)' : 'oklch(0.55 0 0)' }}
              >
                {label === 'QR Code' ? 'QR' : label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
