// ─── Business CRM domain types ────────────────────────────────────────────────

export type BusinessType =
  | 'dog_walker' | 'shelter' | 'trainer' | 'pet_shop' | 'vet'
  | 'chiro' | 'grooming_salon' | 'daycare' | 'boarding' | 'breeder' | 'other';

export const BUSINESS_TYPES: { type: BusinessType; label: string }[] = [
  { type: 'dog_walker',     label: 'Dog Walker' },
  { type: 'shelter',        label: 'Shelter / Rescue' },
  { type: 'trainer',        label: 'Trainer' },
  { type: 'pet_shop',       label: 'Pet Shop' },
  { type: 'vet',            label: 'Veterinary Clinic' },
  { type: 'chiro',          label: 'Chiropractor' },
  { type: 'grooming_salon', label: 'Grooming Salon' },
  { type: 'daycare',        label: 'Daycare' },
  { type: 'boarding',       label: 'Boarding' },
  { type: 'breeder',        label: 'Breeder' },
  { type: 'other',          label: 'Other' },
];

// ─── Capability / permission catalog ─────────────────────────────────────────
// Granular permissions an owner grants to roles. Denormalized onto each staff
// doc so firestore.rules can evaluate access in a single read.

export type Capability =
  // staff & roles
  | 'manage_staff'
  | 'manage_roles'
  | 'manage_business'
  | 'view_business'
  // customers & pets
  | 'view_customers'
  | 'manage_customers'
  // appointments
  | 'view_appointments'
  | 'manage_appointments'
  | 'manage_own_appointments'
  // invoices & billing
  | 'view_invoices'
  | 'manage_invoices'
  | 'record_payments'
  // inventory & shipping
  | 'view_inventory'
  | 'manage_inventory'
  | 'view_shipments'
  | 'manage_shipments';

export interface CapabilityMeta {
  capability: Capability;
  label: string;
  group: string;
}

export const CAPABILITY_CATALOG: CapabilityMeta[] = [
  { capability: 'view_business',          label: 'View dashboard',        group: 'General' },
  { capability: 'manage_business',        label: 'Edit business profile', group: 'General' },
  { capability: 'manage_staff',           label: 'Manage staff',          group: 'Staff & Roles' },
  { capability: 'manage_roles',           label: 'Manage roles',          group: 'Staff & Roles' },
  { capability: 'view_customers',         label: 'View customers',        group: 'Customers' },
  { capability: 'manage_customers',       label: 'Manage customers & pets', group: 'Customers' },
  { capability: 'view_appointments',      label: 'View appointments',     group: 'Appointments' },
  { capability: 'manage_appointments',    label: 'Manage all appointments', group: 'Appointments' },
  { capability: 'manage_own_appointments',label: 'Manage own appointments', group: 'Appointments' },
  { capability: 'view_invoices',          label: 'View invoices',         group: 'Billing' },
  { capability: 'manage_invoices',        label: 'Create & edit invoices', group: 'Billing' },
  { capability: 'record_payments',        label: 'Record payments',       group: 'Billing' },
  { capability: 'view_inventory',         label: 'View inventory',        group: 'Inventory' },
  { capability: 'manage_inventory',       label: 'Manage inventory',      group: 'Inventory' },
  { capability: 'view_shipments',         label: 'View shipments',        group: 'Shipping' },
  { capability: 'manage_shipments',       label: 'Manage shipments',      group: 'Shipping' },
];

export const ALL_CAPABILITIES: Capability[] = CAPABILITY_CATALOG.map(c => c.capability);

export const CAPABILITY_LABELS: Record<Capability, string> = Object.fromEntries(
  CAPABILITY_CATALOG.map(c => [c.capability, c.label]),
) as Record<Capability, string>;

// Default roles seeded for a brand-new business (besides the system "owner" role).
// ─── Modules ──────────────────────────────────────────────────────────────────
// A business owner enables only the pages relevant to their operation. A trainer
// who only sells their time can switch off Inventory and Shipments, for example.
// `undefined` on a Business means "all enabled" (backward-compatible default).

export type BusinessModule = 'customers' | 'appointments' | 'invoices' | 'inventory' | 'shipments';

export const MODULE_CATALOG: { module: BusinessModule; label: string; description: string }[] = [
  { module: 'customers',    label: 'Customers',    description: 'Client records and their pets' },
  { module: 'appointments', label: 'Appointments', description: 'Scheduling and online booking' },
  { module: 'invoices',     label: 'Invoices',     description: 'Billing and payments' },
  { module: 'inventory',    label: 'Inventory',    description: 'Products and stock levels' },
  { module: 'shipments',    label: 'Shipments',    description: 'Order fulfilment and delivery' },
];

export const ALL_MODULES: BusinessModule[] = MODULE_CATALOG.map(m => m.module);

export function isModuleEnabled(
  business: { modules?: BusinessModule[] } | null | undefined,
  module: BusinessModule,
): boolean {
  if (!business || !business.modules) return true; // undefined ⇒ all enabled
  return business.modules.includes(module);
}

export const DEFAULT_ROLE_TEMPLATES: { name: string; capabilities: Capability[] }[] = [
  {
    name: 'Manager',
    capabilities: ALL_CAPABILITIES.filter(c => c !== 'manage_business' && c !== 'manage_roles'),
  },
  {
    name: 'Front desk',
    capabilities: ['view_business', 'view_customers', 'manage_customers', 'view_appointments', 'manage_appointments', 'view_invoices'],
  },
  {
    name: 'Worker',
    capabilities: ['view_business', 'view_customers', 'view_appointments', 'manage_own_appointments'],
  },
];

// ─── Core documents ──────────────────────────────────────────────────────────

export interface BusinessAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  label?: string;            // human-readable location (e.g. "Austin, TX")
}

// Weekly opening hours, one entry per weekday (0 = Sunday … 6 = Saturday).
// `null` means closed that day.
export interface DayHours {
  open: string;              // "HH:MM"
  close: string;             // "HH:MM"
}
export type WeeklyAvailability = (DayHours | null)[]; // length 7

export interface BusySlot {
  start: number;
  end: number;
}

// Business types that interact directly with a dog and may therefore be added to
// a dog's care team. Retail-only types (pet shop, breeder…) are excluded.
export const TEAM_ELIGIBLE_BUSINESS_TYPES: BusinessType[] = [
  'dog_walker', 'vet', 'trainer', 'chiro', 'grooming_salon', 'daycare', 'boarding',
];

export function isTeamEligibleBusiness(type: BusinessType): boolean {
  return TEAM_ELIGIBLE_BUSINESS_TYPES.includes(type);
}

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  logoURL?: string;
  registrationId?: string;     // official business / tax registration number
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: BusinessAddress;
  currency: string;            // ISO 4217, e.g. 'USD'
  ownerUserId: string;         // founding owner — always full capabilities
  staffUserIds: string[];      // array-contains index for "businesses I belong to"
  requireMfa?: boolean;
  modules?: BusinessModule[];  // enabled pages — undefined ⇒ all enabled
  listed?: boolean;            // discoverable in the public directory (default true)
  bookable?: boolean;          // customers may self-book appointments online
  services?: string[];         // offered services, shown to customers
  location?: GeoPoint;         // for "businesses near me" search
  availability?: WeeklyAvailability; // weekly opening hours for online booking
  slotMinutes?: number;        // appointment slot length (default 60)
  createdAt: number;
  updatedAt: number;
}

// Public, read-by-anyone projection of a Business used for discovery. Mirrors the
// `publicDogCards` pattern: a denormalized doc keeps private business data (staff,
// customers, billing) out of the publicly readable surface.
export interface BusinessDirectoryEntry {
  id: string;                  // == business id
  name: string;
  type: BusinessType;
  description?: string;
  logoURL?: string;
  phone?: string;
  email?: string;
  website?: string;
  city?: string;
  location?: GeoPoint;
  bookable: boolean;
  services?: string[];
  availability?: WeeklyAvailability; // weekly opening hours (for slot generation)
  slotMinutes?: number;
  busySlots?: BusySlot[];            // upcoming booked intervals (to grey out slots)
  updatedAt: number;
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DEFAULT_SLOT_MINUTES = 60;

export interface BusinessRole {
  id: string;
  name: string;
  capabilities: Capability[];
  isSystem?: boolean;          // 'owner' role — all caps, undeletable
  createdAt: number;
  updatedAt: number;
}

export interface BusinessStaff {
  userId: string;              // doc id
  displayName: string;
  email: string;
  photoURL?: string;
  roleId: string;              // FK to roles ('owner' for founder)
  capabilities: Capability[];  // denormalized snapshot of role caps
  active: boolean;
  joinedAt: number;
  invitedBy: string;
}

export interface BusinessCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: BusinessAddress;
  notes?: string;
  linkedUserId?: string;       // if this customer also has a PackOps account
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface BusinessPet {
  id: string;
  customerId: string;
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed?: string;
  notes?: string;
  linkedDogId?: string;        // optional bridge to a real PackOps dog
  createdAt: number;
  updatedAt: number;
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  customerId?: string;         // optional: a customer self-booking may not have a CRM record yet
  customerName: string;
  customerUserId?: string;     // app-user who the appointment is for (always set for self-bookings)
  customerEmail?: string;
  customerPhone?: string;
  petId?: string;
  petName?: string;
  serviceLabel: string;
  startAt: number;
  endAt: number;
  assignedStaffId?: string;
  assignedStaffName?: string;
  status: AppointmentStatus;
  source?: 'staff' | 'customer'; // 'customer' = self-booked via the public directory
  notes?: string;
  invoiceId?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export type PaymentStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'void';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  productId?: string;
}

export interface InvoicePayment {
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'other';
  paidAt: number;
  recordedBy: string;
}

export interface Invoice {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  appointmentId?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate?: number;
  total: number;
  amountPaid: number;
  status: PaymentStatus;
  payments: InvoicePayment[];
  issuedAt?: number;
  dueAt?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  unitPrice: number;
  stockQty: number;
  lowStockThreshold?: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export type ShipmentStatus =
  | 'pending' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';

export interface ShipmentItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface Shipment {
  id: string;
  customerId?: string;
  customerName?: string;
  invoiceId?: string;
  items: ShipmentItem[];
  destinationAddress?: BusinessAddress;
  carrier?: string;
  trackingNumber?: string;
  status: ShipmentStatus;
  assignedStaffId?: string;
  shippedAt?: number;
  deliveredAt?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

// ─── Invoice math (single source of truth — see Risks: rounding) ──────────────

export function computeInvoiceTotals(
  lineItems: InvoiceLineItem[],
  taxRate?: number,
): { subtotal: number; total: number } {
  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
  const total = Math.round((subtotal * (1 + (taxRate ?? 0) / 100)) * 100) / 100;
  return { subtotal: Math.round(subtotal * 100) / 100, total };
}
