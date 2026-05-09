import {
  Home, Activity, Dumbbell, Stethoscope, Users, Cpu, QrCode, Settings, Building2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/',        label: 'Dashboard', icon: Home },
  { to: '/routine', label: 'Routine',   icon: Activity },
  { to: '/training',label: 'Training',  icon: Dumbbell },
  { to: '/medical', label: 'Medical',   icon: Stethoscope },
  { to: '/humans',  label: 'Team',      icon: Users },
  { to: '/orgs',    label: 'Orgs',      icon: Building2 },
  { to: '/devices', label: 'Devices',   icon: Cpu },
  { to: '/qr',      label: 'QR Code',   icon: QrCode },
  { to: '/settings',label: 'Settings',  icon: Settings },
];

// Sidebar omits Settings — accessible via topbar avatar menu on desktop
export const SIDEBAR_NAV = NAV_ITEMS.filter(n => n.to !== '/settings');

export const DEFAULT_MOBILE_NAV = ['/', '/routine', '/training', '/medical', '/settings'];
