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
    <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 border-t bg-background flex items-stretch z-50">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          <Icon className="h-5 w-5" />
          <span>{label === 'QR Code' ? 'QR' : label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
