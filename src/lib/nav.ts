import {
  Home, Activity, Dumbbell, Stethoscope, Users, Cpu, QrCode, Settings,
  Calendar, Receipt, Package, Truck, UserCog, ShieldCheck, Lock, MapPin,
  ShoppingCart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Capability, BusinessModule } from '@/types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/',         label: 'Dashboard', icon: Home },
  { to: '/routine',  label: 'Routine',   icon: Activity },
  { to: '/training', label: 'Training',  icon: Dumbbell },
  { to: '/medical',  label: 'Medical',   icon: Stethoscope },
  { to: '/humans',   label: 'Team',      icon: Users },
  { to: '/discover', label: 'Discover',  icon: MapPin },
  { to: '/devices',  label: 'Devices',   icon: Cpu },
  { to: '/qr',       label: 'QR Code',   icon: QrCode },
  { to: '/settings', label: 'Settings',  icon: Settings },
];

// Sidebar omits Settings — accessible via topbar avatar menu on desktop
export const SIDEBAR_NAV = NAV_ITEMS.filter(n => n.to !== '/settings');

export const DEFAULT_MOBILE_NAV = ['/', '/routine', '/training', '/medical', '/settings'];

// ─── Business CRM navigation ──────────────────────────────────────────────────
// `cap` (when present) gates visibility behind a capability the worker must hold.
// `module` (when present) hides the item when the owner has disabled that module.

export interface BusinessNavItem extends NavItem {
  cap?: Capability;
  module?: BusinessModule;
}

export const BUSINESS_NAV_ITEMS: BusinessNavItem[] = [
  { to: '/business',              label: 'Dashboard',    icon: Home },
  { to: '/business/appointments', label: 'Appointments', icon: Calendar, cap: 'view_appointments', module: 'appointments' },
  { to: '/business/orders',       label: 'Orders',       icon: ShoppingCart, cap: 'view_orders',   module: 'orders' },
  { to: '/business/customers',    label: 'Customers',    icon: Users,    cap: 'view_customers',    module: 'customers' },
  { to: '/business/invoices',     label: 'Invoices',     icon: Receipt,  cap: 'view_invoices',     module: 'invoices' },
  { to: '/business/inventory',    label: 'Stock',        icon: Package,  cap: 'view_inventory',    module: 'inventory' },
  { to: '/business/shipments',    label: 'Shipments',    icon: Truck,    cap: 'view_shipments',    module: 'shipments' },
  { to: '/business/staff',        label: 'Staff',        icon: UserCog,  cap: 'manage_staff' },
  { to: '/business/roles',        label: 'Roles',        icon: ShieldCheck, cap: 'manage_roles' },
  { to: '/business/security',     label: 'Security',     icon: Lock },
  { to: '/business/settings',     label: 'Settings',     icon: Settings },
];
