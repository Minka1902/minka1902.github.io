/**
 * PackOps Demo Seed Script
 *
 * SETUP:
 * 1. Go to Firebase Console → Project Settings → Service Accounts → Generate New Private Key
 * 2. Save the downloaded JSON as: scripts/service-account.json
 * 3. Set your Firebase Auth UID: MINKA_UID env var, or edit the constant below.
 * 4. Run: npx ts-node --project scripts/tsconfig.json scripts/seed-demo.ts
 *
 * This script is idempotent — safe to re-run (uses set() throughout).
 */

import * as admin from 'firebase-admin';
import { getFirestore, Firestore, WriteBatch } from 'firebase-admin/firestore';
import * as path from 'path';

// ─── Config ──────────────────────────────────────────────────────────────────

const MINKA_UID = process.env.MINKA_UID || 'YOUR_MINKA_UID_HERE';
const MINKA_EMAIL = 'minka.scharff@gmail.com';
const MINKA_NAME = 'Minka Scharff';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const serviceAccount = require(path.join(__dirname, 'service-account.json')) as admin.ServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db: Firestore = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

// ─── Batch helpers ────────────────────────────────────────────────────────────

/**
 * Accumulates writes, auto-flushing every 490 ops (under 500 Firestore limit).
 */
class AutoBatch {
  private batch: WriteBatch = db.batch();
  private count = 0;

  async set(ref: FirebaseFirestore.DocumentReference, data: object): Promise<void> {
    this.batch.set(ref, data);
    this.count++;
    if (this.count >= 490) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.count > 0) {
      await this.batch.commit();
      this.batch = db.batch();
      this.count = 0;
    }
  }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function dateTs(year: number, month: number, day: number): number {
  return Date.UTC(year, month - 1, day);
}

const BISCUIT_DAYS = 14;

/** 2026-05-02 + dayOffset, returns epoch ms */
function biscuitDay(offset: number): number {
  return dateTs(2026, 5, 2) + offset * 24 * 60 * 60 * 1000;
}

function timeOnDay(dayTs: number, hh: number, mm: number): number {
  return dayTs + hh * 3600_000 + mm * 60_000;
}

// ─── Capability catalog (mirror of src/types/business.ts) ──────────────────────

const ALL_CAPS = [
  'manage_staff', 'manage_roles', 'manage_business', 'view_business',
  'view_customers', 'manage_customers',
  'view_appointments', 'manage_appointments', 'manage_own_appointments',
  'view_invoices', 'manage_invoices', 'record_payments',
  'view_inventory', 'manage_inventory', 'view_shipments', 'manage_shipments',
];

const slug = (s: string) => s.toLowerCase().replace(/[.\s]+/g, '.');

// ─── Seed: Businesses (CRM) ────────────────────────────────────────────────────

interface SeedBusiness {
  id: string;
  name: string;
  type: string;
  description: string;
  email: string;
  domain: string;
  staff: { name: string; roleName: string }[];
  roles: { id: string; name: string; capabilities: string[] }[];
}

async function seedBusinesses(): Promise<void> {
  const now = Date.now();
  const ab = new AutoBatch();

  const managerCaps = ALL_CAPS.filter(c => c !== 'manage_business' && c !== 'manage_roles');
  const frontDeskCaps = ['view_business', 'view_customers', 'manage_customers', 'view_appointments', 'manage_appointments', 'view_invoices'];
  const workerCaps = ['view_business', 'view_customers', 'view_appointments', 'manage_own_appointments'];

  const businesses: SeedBusiness[] = [
    {
      id: 'pawsh-grooming', name: 'Pawsh Grooming', type: 'grooming_salon',
      description: 'Full-service dog grooming salon', email: 'hello@pawsh.example', domain: 'pawsh.example',
      roles: [
        { id: 'role-manager', name: 'Manager', capabilities: managerCaps },
        { id: 'role-front', name: 'Front desk', capabilities: frontDeskCaps },
        { id: 'role-groomer', name: 'Groomer', capabilities: workerCaps },
      ],
      staff: [
        { name: 'Maya Cohen', roleName: 'role-manager' },
        { name: 'Lior Ben-David', roleName: 'role-front' },
        { name: 'Noa Shapiro', roleName: 'role-groomer' },
        { name: 'Eyal Mizrahi', roleName: 'role-groomer' },
        { name: 'Tamar Levy', roleName: 'role-groomer' },
      ],
    },
    {
      id: 'the-vet-clinic', name: 'The Vet Clinic', type: 'vet',
      description: 'Professional veterinary care', email: 'info@thevet.example', domain: 'thevet.example',
      roles: [
        { id: 'role-manager', name: 'Practice Manager', capabilities: managerCaps },
        { id: 'role-vet', name: 'Veterinarian', capabilities: [...workerCaps, 'manage_appointments', 'manage_customers'] },
        { id: 'role-recep', name: 'Receptionist', capabilities: frontDeskCaps },
      ],
      staff: [
        { name: 'Dr. Oren Levi', roleName: 'role-vet' },
        { name: 'Dr. Tal Rosen', roleName: 'role-vet' },
        { name: 'Michal Dayan', roleName: 'role-manager' },
        { name: 'Ronit Bar', roleName: 'role-recep' },
        { name: 'Limor Gal', roleName: 'role-recep' },
      ],
    },
    {
      id: 'the-food-store', name: 'The Food Store', type: 'pet_shop',
      description: 'Premium pet food and supplies', email: 'orders@foodstore.example', domain: 'foodstore.example',
      roles: [
        { id: 'role-manager', name: 'Store Manager', capabilities: managerCaps },
        { id: 'role-clerk', name: 'Clerk', capabilities: ['view_business', 'view_customers', 'manage_customers', 'view_inventory', 'manage_inventory'] },
        { id: 'role-driver', name: 'Driver', capabilities: ['view_business', 'view_shipments', 'manage_shipments'] },
      ],
      staff: [
        { name: 'Yuval Cohen', roleName: 'role-manager' },
        { name: 'Merav Katz', roleName: 'role-clerk' },
        { name: 'Ido Shmueli', roleName: 'role-clerk' },
        { name: 'Nir Friedman', roleName: 'role-driver' },
        { name: 'Orit Levi', roleName: 'role-driver' },
      ],
    },
  ];

  const customerNames = ['Jordan Lee', 'Sam Cohen', 'Maya Roth', 'Daniel Stern', 'Tal Avraham', 'Yael Gross', 'Ron Peretz', 'Dana Friedman'];
  const petNames = ['Max', 'Bella', 'Charlie', 'Lucy', 'Cooper', 'Molly', 'Buddy', 'Daisy'];
  const services = ['Full groom', 'Bath & brush', 'Nail trim', 'Check-up', 'Vaccination', 'Consultation'];
  const productCatalog = [
    { name: 'Premium Kibble 12kg', price: 220, stock: 40, low: 10 },
    { name: 'Grain-Free Puppy 5kg', price: 140, stock: 8, low: 10 },
    { name: 'Dental Chews (30pk)', price: 55, stock: 60, low: 15 },
    { name: 'Leather Leash', price: 90, stock: 5, low: 8 },
    { name: 'Orthopedic Bed L', price: 320, stock: 12, low: 5 },
  ];
  const telAvivAddresses = [
    '3 Rothschild Blvd', '17 Ibn Gabirol St', '45 Ben Yehuda St', '8 Dizengoff St', '22 King George St',
  ];
  const dayMs = 24 * 3600_000;

  for (const biz of businesses) {
    const staffUids = biz.staff.map((_, i) => `${biz.id}-staff-${i + 1}`);

    // Business doc — owner is Minka; staffUserIds includes owner + all staff.
    await ab.set(db.collection('businesses').doc(biz.id), {
      name: biz.name, type: biz.type, description: biz.description, email: biz.email,
      currency: 'ILS', ownerUserId: MINKA_UID, staffUserIds: [MINKA_UID, ...staffUids],
      requireMfa: false, createdAt: now, updatedAt: now,
    });

    // Roles — system owner role + custom roles.
    await ab.set(db.collection('businesses').doc(biz.id).collection('roles').doc('owner'), {
      name: 'Owner', capabilities: ALL_CAPS, isSystem: true, createdAt: now, updatedAt: now,
    });
    for (const role of biz.roles) {
      await ab.set(db.collection('businesses').doc(biz.id).collection('roles').doc(role.id), {
        name: role.name, capabilities: role.capabilities, createdAt: now, updatedAt: now,
      });
    }

    // Staff — owner record + workers (capabilities denormalized from their role).
    await ab.set(db.collection('businesses').doc(biz.id).collection('staff').doc(MINKA_UID), {
      userId: MINKA_UID, displayName: MINKA_NAME, email: MINKA_EMAIL, roleId: 'owner',
      capabilities: ALL_CAPS, active: true, joinedAt: now, invitedBy: MINKA_UID,
    });
    biz.staff.forEach((s, i) => {
      const role = biz.roles.find(r => r.id === s.roleName)!;
      void ab.set(db.collection('businesses').doc(biz.id).collection('staff').doc(staffUids[i]), {
        userId: staffUids[i], displayName: s.name, email: `${slug(s.name)}@${biz.domain}`,
        roleId: role.id, capabilities: role.capabilities, active: true, joinedAt: now, invitedBy: MINKA_UID,
      });
    });

    // Customers + one pet each.
    const customerIds: { id: string; name: string; petId: string; petName: string }[] = [];
    for (let i = 0; i < 8; i++) {
      const custId = `${biz.id}-cust-${i + 1}`;
      const petId = `${biz.id}-pet-${i + 1}`;
      customerIds.push({ id: custId, name: customerNames[i], petId, petName: petNames[i] });
      await ab.set(db.collection('businesses').doc(biz.id).collection('customers').doc(custId), {
        name: customerNames[i], email: `${slug(customerNames[i])}@example.com`,
        phone: `+97250${String(1000000 + i).slice(-7)}`, createdBy: MINKA_UID, createdAt: now, updatedAt: now,
      });
      await ab.set(db.collection('businesses').doc(biz.id).collection('pets').doc(petId), {
        customerId: custId, name: petNames[i], species: 'dog', breed: 'Mixed',
        createdAt: now, updatedAt: now,
      });
    }

    // Appointments — 18 across the next two weeks, mixed statuses.
    const apptStatuses = ['completed', 'completed', 'confirmed', 'scheduled', 'cancelled', 'no_show'];
    for (let i = 0; i < 18; i++) {
      const cust = customerIds[i % customerIds.length];
      const staffIdx = i % biz.staff.length;
      const start = now + (i - 6) * dayMs + 9 * 3600_000 + (i % 4) * 3600_000;
      await ab.set(db.collection('businesses').doc(biz.id).collection('appointments').doc(`${biz.id}-appt-${i + 1}`), {
        customerId: cust.id, customerName: cust.name, petId: cust.petId, petName: cust.petName,
        serviceLabel: services[i % services.length], startAt: start, endAt: start + 3600_000,
        assignedStaffId: staffUids[staffIdx], assignedStaffName: biz.staff[staffIdx].name,
        status: apptStatuses[i % apptStatuses.length], createdBy: MINKA_UID, createdAt: now, updatedAt: now,
      });
    }

    // Invoices — 10, mixed payment status.
    for (let i = 0; i < 10; i++) {
      const cust = customerIds[i % customerIds.length];
      const qty = 1 + (i % 3);
      const unit = 60 + (i % 5) * 25;
      const subtotal = qty * unit;
      const total = Math.round(subtotal * 1.17 * 100) / 100;
      const paidStatus = i % 4 === 0 ? 'paid' : i % 4 === 1 ? 'partial' : i % 4 === 2 ? 'sent' : 'draft';
      const amountPaid = paidStatus === 'paid' ? total : paidStatus === 'partial' ? Math.round(total / 2 * 100) / 100 : 0;
      await ab.set(db.collection('businesses').doc(biz.id).collection('invoices').doc(`${biz.id}-inv-${i + 1}`), {
        number: `INV-2026-${String(i + 1).padStart(4, '0')}`,
        customerId: cust.id, customerName: cust.name,
        lineItems: [{ description: services[i % services.length], quantity: qty, unitPrice: unit }],
        subtotal, taxRate: 17, total, amountPaid, status: paidStatus,
        payments: amountPaid > 0 ? [{ amount: amountPaid, method: 'card', paidAt: now, recordedBy: MINKA_UID }] : [],
        issuedAt: now - i * dayMs, createdBy: MINKA_UID, createdAt: now - i * dayMs, updatedAt: now,
      });
    }

    // Inventory — product catalog (pet shop gets more stock variety).
    productCatalog.forEach((p, i) => {
      void ab.set(db.collection('businesses').doc(biz.id).collection('products').doc(`${biz.id}-prod-${i + 1}`), {
        name: p.name, sku: `SKU-${biz.id.slice(0, 3).toUpperCase()}-${100 + i}`, category: 'Supplies',
        unitPrice: p.price, stockQty: p.stock, lowStockThreshold: p.low, active: true,
        createdAt: now, updatedAt: now,
      });
    });

    // Shipments — 10 across statuses.
    const shipStatuses = ['pending', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'delivered', 'returned'];
    for (let i = 0; i < 10; i++) {
      const cust = customerIds[i % customerIds.length];
      const status = shipStatuses[i % shipStatuses.length];
      await ab.set(db.collection('businesses').doc(biz.id).collection('shipments').doc(`${biz.id}-ship-${i + 1}`), {
        customerId: cust.id, customerName: cust.name,
        items: [{ productId: `${biz.id}-prod-${(i % productCatalog.length) + 1}`, productName: productCatalog[i % productCatalog.length].name, quantity: 1 + (i % 2) }],
        destinationAddress: { street: telAvivAddresses[i % telAvivAddresses.length], city: 'Tel Aviv', country: 'Israel' },
        carrier: 'Local Courier', trackingNumber: `TRK${1000 + i}`, status,
        shippedAt: status === 'pending' || status === 'packed' ? undefined : now - i * dayMs,
        deliveredAt: status === 'delivered' ? now - (i - 1) * dayMs : undefined,
        createdBy: MINKA_UID, createdAt: now - i * dayMs, updatedAt: now,
      });
    }
  }

  await ab.flush();
  console.log('✅ Businesses seeded');
}


// ─── Seed: Biscuit ────────────────────────────────────────────────────────────

async function seedBiscuit(): Promise<void> {
  const ab = new AutoBatch();
  const dogId = 'biscuit-demo';
  const createdAt = dateTs(2026, 5, 2);

  // ── Dog doc ──────────────────────────────────────────────────────────────────
  await ab.set(db.collection('dogs').doc(dogId), {
    id: dogId,
    name: 'Biscuit',
    breed: 'Golden Retriever',
    isMix: false,
    sex: 'male',
    weightKg: 1.8,
    chipId: 'IL985141003456789',
    foodType: 'Royal Canin Mini Puppy',
    feedings: [
      { time: '07:00', amount: '50g' },
      { time: '12:00', amount: '50g' },
      { time: '17:00', amount: '50g' },
      { time: '21:00', amount: '40g' },
    ],
    behaviorNotes:
      'Energetic and curious puppy. Learns fast and loves cuddles. Gets excited around other dogs.',
    emergencyContact: { name: 'Alex Mercer', countryCode: '+972', phone: '0501234567' },
    homeAddress: { address: '8 Dizengoff St, Tel Aviv' },
    mainHumanId: MINKA_UID,
    qrPublic: true,
    qrVisibility: {
      showAddress: true,
      showPhone: true,
      showRescueOrg: false,
      showMedicalAlerts: true,
    },
    createdAt,
    updatedAt: createdAt,
  });

  // ── Dog humans ────────────────────────────────────────────────────────────────
  const humans: Array<{
    userId: string;
    displayName: string;
    email: string;
    role: string;
  }> = [
    { userId: MINKA_UID,     displayName: MINKA_NAME,        email: MINKA_EMAIL,                    role: 'caregiver' },
    { userId: 'friend-1',    displayName: 'Jordan Lee',      email: 'jordan.lee@example.com',       role: 'caregiver' },
    { userId: 'friend-2',    displayName: 'Sam Cohen',       email: 'sam.cohen@example.com',        role: 'caregiver' },
    { userId: 'friend-3',    displayName: 'Maya Roth',       email: 'maya.roth@example.com',        role: 'caregiver' },
    { userId: 'brother-1',   displayName: 'Daniel Scharff',  email: 'daniel.scharff@example.com',  role: 'caregiver' },
  ];

  for (const h of humans) {
    await ab.set(db.collection('dogs').doc(dogId).collection('humans').doc(h.userId), {
      userId: h.userId,
      displayName: h.displayName,
      email: h.email,
      role: h.role,
      approvedAt: createdAt,
      approvedBy: MINKA_UID,
    });
  }

  // ── Routine logs (14 days × 16 logs/day = 224) ───────────────────────────────
  // Days: 2026-05-02 (offset 0) → 2026-05-15 (offset 13)

  for (let d = 0; d < BISCUIT_DAYS; d++) {
    const dayTs = biscuitDay(d);

    const logs: Array<{
      id: string;
      type: string;
      ts: number;
      extras?: Record<string, unknown>;
    }> = [
      // Walks
      { id: `${d}-walk-1`, type: 'walk',  ts: timeOnDay(dayTs, 7, 30), extras: { walkDurationMin: 10 } },
      { id: `${d}-walk-2`, type: 'walk',  ts: timeOnDay(dayTs, 14, 0), extras: { walkDurationMin: 15 } },
      { id: `${d}-walk-3`, type: 'walk',  ts: timeOnDay(dayTs, 19, 0), extras: { walkDurationMin: 10 } },
      // Feedings
      { id: `${d}-eat-1`,  type: 'eat',   ts: timeOnDay(dayTs, 7,  0), extras: { foodType: 'Royal Canin Mini Puppy', foodAmountGrams: 50 } },
      { id: `${d}-eat-2`,  type: 'eat',   ts: timeOnDay(dayTs, 12, 0), extras: { foodType: 'Royal Canin Mini Puppy', foodAmountGrams: 50 } },
      { id: `${d}-eat-3`,  type: 'eat',   ts: timeOnDay(dayTs, 17, 0), extras: { foodType: 'Royal Canin Mini Puppy', foodAmountGrams: 50 } },
      { id: `${d}-eat-4`,  type: 'eat',   ts: timeOnDay(dayTs, 21, 0), extras: { foodType: 'Royal Canin Mini Puppy', foodAmountGrams: 40 } },
      // Waters
      { id: `${d}-drink-1`, type: 'drink', ts: timeOnDay(dayTs, 8,  0), extras: { waterAmountMl: 80 } },
      { id: `${d}-drink-2`, type: 'drink', ts: timeOnDay(dayTs, 13, 0), extras: { waterAmountMl: 80 } },
      { id: `${d}-drink-3`, type: 'drink', ts: timeOnDay(dayTs, 18, 0), extras: { waterAmountMl: 80 } },
      // Pees
      { id: `${d}-pee-1`,  type: 'pee',   ts: timeOnDay(dayTs, 7,  35) },
      { id: `${d}-pee-2`,  type: 'pee',   ts: timeOnDay(dayTs, 10,  0) },
      { id: `${d}-pee-3`,  type: 'pee',   ts: timeOnDay(dayTs, 14,  5) },
      { id: `${d}-pee-4`,  type: 'pee',   ts: timeOnDay(dayTs, 19,  5) },
      // Poops
      { id: `${d}-poop-1`, type: 'poop',  ts: timeOnDay(dayTs, 7,  40) },
      { id: `${d}-poop-2`, type: 'poop',  ts: timeOnDay(dayTs, 14, 10) },
    ];

    for (const log of logs) {
      await ab.set(
        db.collection('dogs').doc(dogId).collection('routines').doc(`log-${log.id}`),
        {
          id: `log-${log.id}`,
          dogId,
          type: log.type,
          timestamp: log.ts,
          loggedBy: MINKA_UID,
          loggedByName: MINKA_NAME,
          source: 'manual',
          ...(log.extras ?? {}),
        }
      );
    }
  }

  // ── Training sessions ─────────────────────────────────────────────────────────

  type SessionDef = {
    id: string;
    day: number;
    trainingType: string;
    objective: string;
    exercises: Array<{ name: string; reps?: number; durationMin?: number; notes?: string }>;
  };

  const sessionDefs: SessionDef[] = [
    // sit — days 2,4,6,8,10 (offsets 0,2,4,6,8)
    { id: 'sit-1', day: 0,  trainingType: 'obedience', objective: 'Practice sit command', exercises: [{ name: 'sit', reps: 10, notes: 'Puppy responded well' }] },
    { id: 'sit-2', day: 2,  trainingType: 'obedience', objective: 'Practice sit command', exercises: [{ name: 'sit', reps: 10, notes: 'Puppy responded well' }] },
    { id: 'sit-3', day: 4,  trainingType: 'obedience', objective: 'Practice sit command', exercises: [{ name: 'sit', reps: 10, notes: 'Puppy responded well' }] },
    { id: 'sit-4', day: 6,  trainingType: 'obedience', objective: 'Practice sit command', exercises: [{ name: 'sit', reps: 10, notes: 'Puppy responded well' }] },
    { id: 'sit-5', day: 8,  trainingType: 'obedience', objective: 'Practice sit command', exercises: [{ name: 'sit', reps: 10, notes: 'Puppy responded well' }] },
    // heel — days 3,6,9,12 (offsets 1,4,7,10)
    { id: 'heel-1', day: 1,  trainingType: 'heel', objective: 'Practice heel command', exercises: [{ name: 'heel', reps: 8 }] },
    { id: 'heel-2', day: 4,  trainingType: 'heel', objective: 'Practice heel command', exercises: [{ name: 'heel', reps: 8 }] },
    { id: 'heel-3', day: 7,  trainingType: 'heel', objective: 'Practice heel command', exercises: [{ name: 'heel', reps: 8 }] },
    { id: 'heel-4', day: 10, trainingType: 'heel', objective: 'Practice heel command', exercises: [{ name: 'heel', reps: 8 }] },
    // lay down — days 4,7,10,13 (offsets 2,5,8,11)
    { id: 'laydown-1', day: 2,  trainingType: 'obedience', objective: 'Practice lay down command', exercises: [{ name: 'lay down', reps: 8 }] },
    { id: 'laydown-2', day: 5,  trainingType: 'obedience', objective: 'Practice lay down command', exercises: [{ name: 'lay down', reps: 8 }] },
    { id: 'laydown-3', day: 8,  trainingType: 'obedience', objective: 'Practice lay down command', exercises: [{ name: 'lay down', reps: 8 }] },
    { id: 'laydown-4', day: 11, trainingType: 'obedience', objective: 'Practice lay down command', exercises: [{ name: 'lay down', reps: 8 }] },
    // roll — days 5,9,13 (offsets 3,7,11)
    { id: 'roll-1', day: 3,  trainingType: 'obedience', objective: 'Practice roll over command', exercises: [{ name: 'roll', reps: 5 }] },
    { id: 'roll-2', day: 7,  trainingType: 'obedience', objective: 'Practice roll over command', exercises: [{ name: 'roll', reps: 5 }] },
    { id: 'roll-3', day: 11, trainingType: 'obedience', objective: 'Practice roll over command', exercises: [{ name: 'roll', reps: 5 }] },
    // hand — days 6,10,14 (offsets 4,8,12)
    { id: 'hand-1', day: 4,  trainingType: 'obedience', objective: 'Practice hand/shake command', exercises: [{ name: 'hand', reps: 8 }] },
    { id: 'hand-2', day: 8,  trainingType: 'obedience', objective: 'Practice hand/shake command', exercises: [{ name: 'hand', reps: 8 }] },
    { id: 'hand-3', day: 12, trainingType: 'obedience', objective: 'Practice hand/shake command', exercises: [{ name: 'hand', reps: 8 }] },
  ];

  for (const s of sessionDefs) {
    const sessionTs = timeOnDay(biscuitDay(s.day), 16, 0); // 4pm training
    const sessionNow = Date.now();
    await ab.set(
      db.collection('dogs').doc(dogId).collection('trainingSessions').doc(`session-biscuit-${s.id}`),
      {
        id: `session-biscuit-${s.id}`,
        dogId,
        trainingType: s.trainingType,
        trainerId: MINKA_UID,
        trainerName: MINKA_NAME,
        scheduledAt: sessionTs,
        durationActualMin: 10,
        objective: s.objective,
        result: 'Responded well. Good progress.',
        exercises: s.exercises,
        templateUsed: false,
        createdAt: sessionNow,
        updatedAt: sessionNow,
      }
    );
  }

  // ── Medical records ───────────────────────────────────────────────────────────
  const medNow = Date.now();

  // 1. Vaccination DHPP
  await ab.set(
    db.collection('dogs').doc(dogId).collection('medicalVaccinations').doc('vax-dhpp-1'),
    {
      id: 'vax-dhpp-1',
      dogId,
      category: 'vaccination',
      title: 'DHPP Vaccination',
      vaccineName: 'DHPP',
      date: dateTs(2026, 4, 11),
      nextDueDate: dateTs(2026, 5, 24),
      provider: 'The Vet',
      notes: 'First puppy vaccination. No adverse reactions.',
      createdBy: MINKA_UID,
      createdByName: MINKA_NAME,
      createdAt: medNow,
      updatedAt: medNow,
    }
  );

  // 2. Deworming 1st
  await ab.set(
    db.collection('dogs').doc(dogId).collection('medicalDeworming').doc('deworm-1'),
    {
      id: 'deworm-1',
      dogId,
      category: 'deworming',
      title: '1st Deworming',
      productName: 'Milbemax',
      date: dateTs(2026, 3, 14),
      createdBy: MINKA_UID,
      createdByName: MINKA_NAME,
      createdAt: medNow,
      updatedAt: medNow,
    }
  );

  // 3. Deworming 2nd
  await ab.set(
    db.collection('dogs').doc(dogId).collection('medicalDeworming').doc('deworm-2'),
    {
      id: 'deworm-2',
      dogId,
      category: 'deworming',
      title: '2nd Deworming',
      productName: 'Milbemax',
      date: dateTs(2026, 3, 28),
      nextDueDate: dateTs(2026, 4, 25),
      createdBy: MINKA_UID,
      createdByName: MINKA_NAME,
      createdAt: medNow,
      updatedAt: medNow,
    }
  );

  await ab.flush();
  console.log('✅ Biscuit seeded');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seedAll(): Promise<void> {
  console.log('🌱 Starting seed...');
  await seedBusinesses();
  await seedBiscuit();
  console.log('✅ Seed complete!');
}

seedAll().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
