import { NavLink } from 'react-router-dom';
import {
  Home, Activity, Dumbbell, Stethoscope, Users, Cpu, QrCode, Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/',        label: 'Dashboard', icon: Home },
  { to: '/routine', label: 'Routine',   icon: Activity },
  { to: '/training',label: 'Training',  icon: Dumbbell },
  { to: '/medical', label: 'Medical',   icon: Stethoscope },
  { to: '/humans',  label: 'Humans',    icon: Users },
  { to: '/devices', label: 'Devices',   icon: Cpu },
  { to: '/qr',      label: 'QR Code',   icon: QrCode },
  { to: '/settings',label: 'Settings',  icon: Settings },
] as const;

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r bg-background flex flex-col py-4 gap-1">
      <div className="px-4 mb-4 font-bold text-lg tracking-tight">PackOps</div>
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-4 py-2 text-sm rounded-lg mx-2 transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </aside>
  );
}
