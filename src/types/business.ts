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
  | 'manage_shipments'
  // orders
  | 'view_orders'
  | 'manage_orders'
  // boarding & daycare
  | 'view_boarding'
  | 'manage_boarding'
  // services & price list
  | 'view_services'
  | 'manage_services'
  // staff shifts
  | 'view_shifts'
  | 'manage_shifts'
  // purchasing
  | 'view_purchasing'
  | 'manage_purchasing'
  // reports (read-only module)
  | 'view_reports'
  // messaging
  | 'view_messages'
  | 'manage_messages'
  // pet report cards
  | 'view_report_cards'
  | 'manage_report_cards'
  // packages & memberships
  | 'view_packages'
  | 'manage_packages'
  // shelter adoptions
  | 'view_adoptions'
  | 'manage_adoptions'
  // vet patient charts
  | 'view_patients'
  | 'manage_patients'
  // trainer group classes
  | 'view_classes'
  | 'manage_classes'
  // breeder litters & waitlist
  | 'view_breeding'
  | 'manage_breeding';

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
  { capability: 'view_orders',            label: 'View orders',           group: 'Orders' },
  { capability: 'manage_orders',          label: 'Manage orders',         group: 'Orders' },
  { capability: 'view_boarding',          label: 'View stays',            group: 'Boarding' },
  { capability: 'manage_boarding',        label: 'Manage stays',          group: 'Boarding' },
  { capability: 'view_services',          label: 'View services',         group: 'Services' },
  { capability: 'manage_services',        label: 'Manage services & prices', group: 'Services' },
  { capability: 'view_shifts',            label: 'View rota',             group: 'Shifts' },
  { capability: 'manage_shifts',          label: 'Manage shifts & time off', group: 'Shifts' },
  { capability: 'view_purchasing',        label: 'View purchase orders',  group: 'Purchasing' },
  { capability: 'manage_purchasing',      label: 'Manage purchasing',     group: 'Purchasing' },
  { capability: 'view_reports',           label: 'View reports',          group: 'Reports' },
  { capability: 'view_messages',          label: 'View messages',         group: 'Messages' },
  { capability: 'manage_messages',        label: 'Reply to customers',    group: 'Messages' },
  { capability: 'view_report_cards',      label: 'View report cards',     group: 'Report cards' },
  { capability: 'manage_report_cards',    label: 'Write report cards',    group: 'Report cards' },
  { capability: 'view_packages',          label: 'View packages',         group: 'Packages' },
  { capability: 'manage_packages',        label: 'Manage & sell packages', group: 'Packages' },
  { capability: 'view_adoptions',         label: 'View adoptions',        group: 'Adoptions' },
  { capability: 'manage_adoptions',       label: 'Manage adoptions',      group: 'Adoptions' },
  { capability: 'view_patients',          label: 'View patient charts',   group: 'Patients' },
  { capability: 'manage_patients',        label: 'Write patient charts',  group: 'Patients' },
  { capability: 'view_classes',           label: 'View classes',          group: 'Classes' },
  { capability: 'manage_classes',         label: 'Manage classes',        group: 'Classes' },
  { capability: 'view_breeding',          label: 'View litters & waitlist', group: 'Breeding' },
  { capability: 'manage_breeding',        label: 'Manage litters & waitlist', group: 'Breeding' },
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

export type BusinessModule =
  | 'customers' | 'appointments' | 'invoices' | 'inventory' | 'shipments'
  | 'orders' | 'boarding' | 'services' | 'shifts' | 'purchasing' | 'reports'
  | 'messages' | 'report_cards' | 'packages'
  | 'adoptions' | 'patients' | 'classes' | 'breeding';

export type ModuleGroup = 'Operations' | 'Customer' | 'Specialty';

export const MODULE_CATALOG: { module: BusinessModule; label: string; description: string; group: ModuleGroup }[] = [
  { module: 'customers',    label: 'Customers',    description: 'Client records and their pets', group: 'Operations' },
  { module: 'appointments', label: 'Appointments', description: 'Scheduling and online booking', group: 'Operations' },
  { module: 'invoices',     label: 'Invoices',     description: 'Billing and payments', group: 'Operations' },
  { module: 'inventory',    label: 'Inventory',    description: 'Products and stock levels', group: 'Operations' },
  { module: 'shipments',    label: 'Shipments',    description: 'Order fulfilment and delivery', group: 'Operations' },
  { module: 'orders',       label: 'Orders',       description: 'Customer product orders, pickup or delivery', group: 'Operations' },
  { module: 'services',     label: 'Services & prices', description: 'The service menu offered to customers', group: 'Operations' },
  { module: 'shifts',       label: 'Shifts',       description: 'Staff rota and time-off requests', group: 'Operations' },
  { module: 'purchasing',   label: 'Purchasing',   description: 'Supplier orders and goods receiving', group: 'Operations' },
  { module: 'reports',      label: 'Reports',      description: 'Revenue, volume and occupancy analytics', group: 'Operations' },
  { module: 'boarding',     label: 'Boarding & daycare', description: 'Stays, capacity and check-in/out', group: 'Customer' },
  { module: 'messages',     label: 'Messages',     description: 'Customer chat and status updates', group: 'Customer' },
  { module: 'report_cards', label: 'Report cards', description: 'Visit summaries sent to pet parents', group: 'Customer' },
  { module: 'packages',     label: 'Packages',     description: 'Multi-visit passes and memberships', group: 'Customer' },
  { module: 'adoptions',    label: 'Adoptions',    description: 'Adoptable animals and applications', group: 'Specialty' },
  { module: 'patients',     label: 'Patient charts', description: 'Per-pet medical history', group: 'Specialty' },
  { module: 'classes',      label: 'Group classes', description: 'Class scheduling and enrollment', group: 'Specialty' },
  { module: 'breeding',     label: 'Litters & waitlist', description: 'Litter records and reservations', group: 'Specialty' },
];

export const ALL_MODULES: BusinessModule[] = MODULE_CATALOG.map(m => m.module);

export function isModuleEnabled(
  business: { modules?: BusinessModule[] } | null | undefined,
  module: BusinessModule,
): boolean {
  if (!business || !business.modules) return true; // undefined ⇒ all enabled
  return business.modules.includes(module);
}

// Modules every business type starts with, regardless of specialty.
export const BASE_MODULES: BusinessModule[] = [
  'customers', 'invoices', 'messages', 'reports', 'services', 'shifts', 'packages',
];

// Modules auto-enabled at registration per business type. The owner can always
// adjust the set later in Settings.
export const TYPE_MODULE_PRESETS: Record<BusinessType, BusinessModule[]> = {
  pet_shop:       [...BASE_MODULES, 'orders', 'inventory', 'shipments', 'purchasing'],
  vet:            [...BASE_MODULES, 'appointments', 'patients', 'report_cards'],
  grooming_salon: [...BASE_MODULES, 'appointments', 'report_cards'],
  chiro:          [...BASE_MODULES, 'appointments'],
  trainer:        [...BASE_MODULES, 'appointments', 'classes', 'report_cards'],
  dog_walker:     [...BASE_MODULES, 'appointments', 'report_cards'],
  daycare:        [...BASE_MODULES, 'boarding', 'appointments', 'report_cards'],
  boarding:       [...BASE_MODULES, 'boarding', 'appointments', 'report_cards'],
  shelter:        [...BASE_MODULES, 'adoptions', 'appointments'],
  breeder:        [...BASE_MODULES, 'breeding'],
  other:          ALL_MODULES,
};

export const DEFAULT_ROLE_TEMPLATES: { name: string; capabilities: Capability[] }[] = [
  {
    name: 'Manager',
    capabilities: ALL_CAPABILITIES.filter(c => c !== 'manage_business' && c !== 'manage_roles'),
  },
  {
    name: 'Front desk',
    capabilities: [
      'view_business', 'view_customers', 'manage_customers',
      'view_appointments', 'manage_appointments', 'view_invoices',
      'view_orders', 'view_boarding', 'manage_boarding',
      'view_messages', 'manage_messages',
      'view_services', 'view_packages',
      'view_patients', 'view_classes', 'view_adoptions', 'view_breeding',
    ],
  },
  {
    name: 'Worker',
    capabilities: [
      'view_business', 'view_customers', 'view_appointments', 'manage_own_appointments',
      'view_boarding', 'view_shifts', 'manage_report_cards',
    ],
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
  commerce?: CommerceSettings; // how the business takes & fulfils product orders
  boarding?: BoardingSettings; // capacity & stay-request settings
  createdAt: number;
  updatedAt: number;
}

// ─── Commerce / order-taking configuration ────────────────────────────────────
// The owner answers the operational questions once, in Settings: do we deliver?
// who carries it? how do customers pay? Orders are then constrained to the
// configured options, both for staff and for customers ordering online.

export type FulfillmentMethod  = 'pickup' | 'delivery';
export type DeliveryHandler    = 'business' | 'carrier';
// 'online' is record-only for now: the order is marked paid at placement time.
// The model is shaped so a real payment provider can slot in later.
export type OrderPaymentMethod = 'online' | 'in_person' | 'on_delivery';

export const ORDER_PAYMENT_LABELS: Record<OrderPaymentMethod, string> = {
  online:      'Pay online',
  in_person:   'Pay in person',
  on_delivery: 'Pay on delivery',
};

export interface CommerceSettings {
  ordersOpen: boolean;               // accept customer orders from the public directory
  fulfillment: 'pickup' | 'delivery' | 'both';
  deliveryHandler?: DeliveryHandler; // who carries delivery orders
  deliveryFee?: number;              // flat fee, business currency
  paymentMethods: OrderPaymentMethod[];
}

export interface BoardingSettings {
  capacity: number;            // kennels / spaces
  requestsOpen: boolean;       // accept stay requests from the public directory
  pricePerNight?: number;
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
  currency?: string;                 // ISO 4217 — needed to render catalog prices
  // commerce summary (orders module)
  orderable?: boolean;
  fulfillment?: 'pickup' | 'delivery' | 'both';
  deliveryFee?: number;
  paymentMethods?: OrderPaymentMethod[];
  // boarding summary — raw capacity & occupancy counts stay private; customers
  // only learn which upcoming dates are full.
  boarding?: { requestsOpen: boolean; pricePerNight?: number; fullDates: string[] };
  serviceMenu?: PublicServiceMenuItem[]; // priced service list (services module)
  packages?: PublicPackageItem[];        // purchasable packages (packages module)
  // review aggregate — best-effort merge-write by the reviewing client
  ratingAvg?: number;
  ratingCount?: number;
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

// ─── Orders ───────────────────────────────────────────────────────────────────
// businesses/{bid}/orders. Customers order in-stock products from the public
// directory; staff create orders for phone/walk-in customers. Stock moves only
// when staff accept (transactional decrement), never at placement.

export type OrderStatus =
  | 'placed' | 'accepted' | 'preparing' | 'ready_for_pickup'
  | 'out_for_delivery' | 'completed' | 'cancelled' | 'rejected';

export interface OrderItem {
  productId: string;
  name: string;                // snapshot — product may be renamed later
  quantity: number;
  unitPrice: number;           // snapshot at order time
}

export interface Order {
  id: string;
  items: OrderItem[];
  customerUserId?: string;     // app user (always set for self-orders)
  customerId?: string;         // CRM customer (staff-created orders)
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  fulfillment: FulfillmentMethod;
  deliveryAddress?: BusinessAddress;
  deliveryHandler?: DeliveryHandler;  // snapshot of the business setting
  deliveryFee?: number;               // snapshot at order time
  paymentMethod: OrderPaymentMethod;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  subtotal: number;
  total: number;               // subtotal + deliveryFee
  status: OrderStatus;
  source: 'staff' | 'customer';
  stockAdjusted?: boolean;     // true while this order holds decremented stock
  shipmentId?: string;         // carrier deliveries
  invoiceId?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

// Public projection of one product: businessDirectory/{bid}/catalog/{productId}.
// Deliberately omits stockQty, sku and thresholds — customers only learn whether
// an item can be ordered right now.
export interface PublicCatalogItem {
  id: string;                  // == product id
  name: string;
  category?: string;
  unitPrice: number;
  inStock: boolean;
  updatedAt: number;
}

export function computeOrderTotals(
  items: OrderItem[],
  deliveryFee = 0,
): { subtotal: number; total: number } {
  const { subtotal } = computeInvoiceTotals(
    items.map(i => ({ description: i.name, quantity: i.quantity, unitPrice: i.unitPrice, productId: i.productId })),
  );
  return { subtotal, total: Math.round((subtotal + deliveryFee) * 100) / 100 };
}

// Pure half of the accept-order transaction: which items can't be covered by
// current stock. Empty result ⇒ safe to decrement.
export function findStockShortages(
  items: OrderItem[],
  stockById: Record<string, number | undefined>,
): { productId: string; name: string; requested: number; available: number }[] {
  return items
    .filter(i => (stockById[i.productId] ?? 0) < i.quantity)
    .map(i => ({ productId: i.productId, name: i.name, requested: i.quantity, available: stockById[i.productId] ?? 0 }));
}

// ─── Boarding & daycare ───────────────────────────────────────────────────────
// businesses/{bid}/stays. Dates are 'YYYY-MM-DD' calendar dates in the business's
// local sense; a stay occupies the nights [startDate, endDate) so back-to-back
// turnover works and a same-day visit (daycare) counts as one day.

export type StayStatus = 'requested' | 'approved' | 'declined' | 'checked_in' | 'checked_out' | 'cancelled';

// Statuses that occupy a space (for capacity checks).
export const ACTIVE_STAY_STATUSES: StayStatus[] = ['approved', 'checked_in'];

export interface StayFoodPlan {
  providedBy: 'owner' | 'business';
  feedingTimes?: string[];     // "HH:MM"
  amount?: string;             // free text, e.g. "1 cup kibble"
  instructions?: string;
}

export interface StayMedication {
  name: string;
  dosage?: string;
  schedule?: string;
}

export interface StayDailyNote {
  at: number;
  byUserId: string;
  byName: string;
  text: string;
}

export interface Stay {
  id: string;
  customerUserId?: string;     // app user (always set for self-requested stays)
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  petId?: string;
  petName: string;
  petSpecies?: 'dog' | 'cat' | 'other';
  startDate: string;           // 'YYYY-MM-DD'
  endDate: string;             // checkout date; occupied nights = [start, end)
  status: StayStatus;
  source: 'staff' | 'customer';
  foodPlan?: StayFoodPlan;
  medications?: StayMedication[];
  careInstructions?: string;
  dailyNotes?: StayDailyNote[]; // appended with arrayUnion
  invoiceId?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

// ─── Services & price list ────────────────────────────────────────────────────
// businesses/{bid}/services — the menu appointments and invoices pick from.

export interface BusinessService {
  id: string;
  name: string;
  description?: string;
  durationMinutes?: number;    // overrides the business slot length when set
  price: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PublicServiceMenuItem {
  name: string;
  price: number;
  durationMinutes?: number;
}

// ─── Staff shifts & time off ──────────────────────────────────────────────────
// businesses/{bid}/shifts and businesses/{bid}/timeOff.

export interface Shift {
  id: string;
  staffUserId: string;
  staffName: string;
  date: string;                // 'YYYY-MM-DD'
  start: string;               // 'HH:MM'
  end: string;                 // 'HH:MM'
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type TimeOffStatus = 'requested' | 'approved' | 'declined';

export interface TimeOffRequest {
  id: string;
  staffUserId: string;
  staffName: string;
  startDate: string;           // 'YYYY-MM-DD', inclusive
  endDate: string;             // inclusive
  reason?: string;
  status: TimeOffStatus;
  createdAt: number;
  updatedAt: number;
}

// ─── Purchasing / supplier orders ─────────────────────────────────────────────
// businesses/{bid}/suppliers and businesses/{bid}/purchaseOrders. Receiving a PO
// increments product stock (mirror image of accepting a customer order).

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  status: PurchaseOrderStatus;
  expectedAt?: number;         // expected delivery (ms)
  receivedAt?: number;
  total: number;
  stockAdjusted?: boolean;     // true once receiving incremented stock
  notes?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export function computePurchaseOrderTotal(items: PurchaseOrderItem[]): number {
  return Math.round(items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0) * 100) / 100;
}

// ─── Messaging ────────────────────────────────────────────────────────────────
// businesses/{bid}/threads/{tid} (+ messages subcollection). One thread per
// customer app-user. System messages are posted by the acting client on key
// transitions (order status, stay approval, …) — in-app only, no push.

export interface MessageThread {
  id: string;
  customerUserId: string;
  customerName: string;
  businessId: string;          // denormalized for the customer's collection-group query
  businessName: string;
  lastMessageAt: number;
  lastMessageText: string;
  unreadByStaff: number;
  unreadByCustomer: number;
  createdAt: number;
  updatedAt: number;
}

export interface ThreadMessage {
  id: string;
  at: number;
  fromUserId: string;
  fromName: string;
  fromSide: 'staff' | 'customer';
  kind: 'chat' | 'system';
  text: string;
}

// ─── Pet report cards ─────────────────────────────────────────────────────────
// businesses/{bid}/reportCards — the polished customer-facing visit summary
// (boarding daily notes stay internal).

export type ReportCardMood = 'great' | 'good' | 'okay' | 'stressed';

export interface ReportCard {
  id: string;
  customerUserId?: string;
  customerId?: string;
  customerName: string;
  petName: string;
  appointmentId?: string;
  stayId?: string;
  date: string;                // 'YYYY-MM-DD'
  mood?: ReportCardMood;
  activities: string[];
  summary: string;
  photoURLs?: string[];
  sentAt?: number;             // when shared with the customer
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

// ─── Packages & memberships ───────────────────────────────────────────────────
// Templates at businesses/{bid}/packages; purchases at businesses/{bid}/customerPackages.

export type PackageCreditType = 'appointment' | 'stay' | 'class';

export interface PackageDef {
  id: string;
  name: string;
  description?: string;
  price: number;
  credits: number;
  creditType: PackageCreditType;
  validityDays?: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export type CustomerPackageStatus = 'active' | 'exhausted' | 'expired';

export interface CustomerPackage {
  id: string;
  packageId: string;
  name: string;                // snapshot
  creditType: PackageCreditType;
  customerUserId?: string;
  customerId?: string;
  customerName: string;
  creditsTotal: number;
  creditsRemaining: number;
  expiresAt?: number;
  invoiceId?: string;
  status: CustomerPackageStatus;
  createdAt: number;
  updatedAt: number;
}

export interface PublicPackageItem {
  id: string;                  // == package def id
  name: string;
  description?: string;
  price: number;
  credits: number;
  creditType: PackageCreditType;
  validityDays?: number;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
// businessDirectory/{bid}/reviews/{uid} — doc id == reviewer uid (one per user).

export interface BusinessReview {
  rating: number;              // 1..5, validated in rules
  text?: string;
  authorName: string;
  updatedAt: number;
}

// ─── Shelter adoptions ────────────────────────────────────────────────────────
// businesses/{bid}/adoptionListings (+ public projection businessDirectory/{bid}/adoptables)
// and businesses/{bid}/adoptionApplications.

export type AdoptionListingStatus = 'available' | 'pending' | 'adopted';

export interface AdoptionListing {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed?: string;
  ageMonths?: number;
  sex?: 'male' | 'female';
  description: string;
  photoURLs?: string[];
  fee?: number;
  status: AdoptionListingStatus;
  createdAt: number;
  updatedAt: number;
}

// Public projection — available/pending listings only.
export interface PublicAdoptable {
  id: string;                  // == listing id
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed?: string;
  ageMonths?: number;
  sex?: 'male' | 'female';
  description: string;
  photoURLs?: string[];
  fee?: number;
  status: AdoptionListingStatus;
  updatedAt: number;
}

export type AdoptionApplicationStatus = 'submitted' | 'under_review' | 'approved' | 'declined';

export interface AdoptionApplication {
  id: string;
  listingId: string;
  petName: string;             // snapshot of the listing name
  customerUserId: string;
  applicantName: string;
  applicantEmail?: string;
  applicantPhone?: string;
  homeInfo: {
    housing: string;           // e.g. "apartment", "house"
    hasYard: boolean;
    otherPets?: string;
    experience?: string;
  };
  status: AdoptionApplicationStatus;
  notes?: string;              // staff-side review notes
  createdAt: number;
  updatedAt: number;
}

// ─── Vet patient charts ───────────────────────────────────────────────────────
// businesses/{bid}/chartEntries — flat, filtered by petId client-side.

export type ChartEntryType = 'visit' | 'diagnosis' | 'prescription' | 'vaccination' | 'note';

export interface ChartEntry {
  id: string;
  petId: string;
  petName: string;
  customerId: string;
  type: ChartEntryType;
  title: string;
  details?: string;
  date: string;                // 'YYYY-MM-DD'
  staffName: string;
  appointmentId?: string;
  medicationName?: string;     // prescription / vaccination extras
  dosage?: string;
  batchNumber?: string;
  sharedMedicalRecordId?: string; // set once shared into the owner's PackOps records
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

// ─── Trainer group classes ────────────────────────────────────────────────────
// businesses/{bid}/classes and businesses/{bid}/enrollments (+ public projection
// businessDirectory/{bid}/classCatalog with spotsLeft).

export interface ClassSession {
  date: string;                // 'YYYY-MM-DD'
  start: string;               // 'HH:MM'
  end: string;                 // 'HH:MM'
}

export type GroupClassStatus = 'open' | 'full' | 'completed' | 'cancelled';

export interface GroupClass {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  price?: number;
  sessions: ClassSession[];
  status: GroupClassStatus;
  createdAt: number;
  updatedAt: number;
}

export type EnrollmentStatus = 'enrolled' | 'cancelled' | 'waitlisted';

export interface ClassEnrollment {
  id: string;
  classId: string;
  customerUserId?: string;
  customerId?: string;
  customerName: string;
  petName: string;
  status: EnrollmentStatus;
  attendance?: Record<string, boolean>; // session date → attended
  redeemedPackageId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PublicClassItem {
  id: string;                  // == class id
  name: string;
  description?: string;
  price?: number;
  sessions: ClassSession[];
  spotsLeft: number;
  updatedAt: number;
}

export function classSpotsLeft(
  cls: Pick<GroupClass, 'capacity'>,
  enrollments: Pick<ClassEnrollment, 'status'>[],
): number {
  const taken = enrollments.filter(e => e.status === 'enrolled').length;
  return Math.max(0, cls.capacity - taken);
}

// ─── Breeder litters & waitlist ───────────────────────────────────────────────
// businesses/{bid}/litters and businesses/{bid}/waitlist (createdAt order ==
// waitlist position). Deposits ride on invoices' existing 'partial' status.

export type PuppyStatus = 'available' | 'reserved' | 'sold';

export interface LitterPuppy {
  id: string;
  name?: string;
  sex: 'male' | 'female';
  color?: string;
  status: PuppyStatus;
}

export interface Litter {
  id: string;
  breed: string;
  damName: string;
  sireName: string;
  bornAt?: string;             // 'YYYY-MM-DD'
  expectedAt?: string;         // 'YYYY-MM-DD' (unborn litters)
  puppies: LitterPuppy[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type WaitlistStatus = 'waiting' | 'offered' | 'reserved' | 'fulfilled' | 'cancelled';

export interface WaitlistEntry {
  id: string;
  customerUserId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  preferences?: { sex?: 'male' | 'female'; color?: string; timing?: string };
  status: WaitlistStatus;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

// Public projection of a litter for the directory.
export interface PublicLitterItem {
  id: string;                  // == litter id
  breed: string;
  bornAt?: string;
  expectedAt?: string;
  availableCount: number;
  updatedAt: number;
}
