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

// ─── Seed: Organizations ──────────────────────────────────────────────────────

async function seedOrgs(): Promise<void> {
  const now = Date.now();
  const ab = new AutoBatch();

  // ── The Home (shelter) ──────────────────────────────────────────────────────

  const homeId = 'the-home';
  const homeStaffIds = Array.from({ length: 10 }, (_, i) => `staff-home-${i + 1}`);
  const homeStaffNames = [
    'Maya Cohen', 'Lior Ben-David', 'Noa Shapiro', 'Eyal Mizrahi', 'Tamar Levy',
    'Avi Katz', 'Shira Goldberg', 'Ron Peretz', 'Dana Friedman', 'Yoav Haim',
  ];

  // Org doc
  await ab.set(db.collection('organizations').doc(homeId), {
    id: homeId,
    name: 'The Home',
    type: 'shelter',
    description: 'A warm shelter for dogs in need',
    email: 'info@thehome.org',
    address: { street: '14 Shelter Lane', city: 'Tel Aviv', country: 'Israel' },
    leaderUserIds: [MINKA_UID],
    staffUserIds: homeStaffIds,
    totalCapacity: 50,
    createdBy: MINKA_UID,
    createdAt: now,
    updatedAt: now,
  });

  // Leader member
  await ab.set(db.collection('organizations').doc(homeId).collection('members').doc(MINKA_UID), {
    userId: MINKA_UID,
    displayName: MINKA_NAME,
    email: MINKA_EMAIL,
    role: 'leader',
    joinedAt: now,
  });

  // Staff members
  for (let i = 0; i < 10; i++) {
    const uid = homeStaffIds[i];
    const name = homeStaffNames[i];
    await ab.set(db.collection('organizations').doc(homeId).collection('members').doc(uid), {
      userId: uid,
      displayName: name,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@thehome.org`,
      role: 'staff',
      staffRole: 'daycare_staff',
      joinedAt: now,
      invitedBy: MINKA_UID,
    });
  }

  // Shelter dog names
  const shelterDogNames = [
    'Boaz', 'Gili', 'Roni', 'Nevo', 'Shaked',
    'Lavi', 'Dani', 'Ofri', 'Tal', 'Yam',
    'Kfir', 'Dvir', 'Erez', 'Rotem', 'Nir',
    'Alon', 'Bar',
  ];

  // Enrolled dogs (17)
  for (let i = 1; i <= 17; i++) {
    const dogId = `shelter-dog-${i}`;
    const dogName = shelterDogNames[i - 1] ?? `Dog ${i}`;
    await ab.set(
      db.collection('organizations').doc(homeId).collection('enrolledDogs').doc(dogId),
      {
        dogId,
        dogName,
        mainHumanId: MINKA_UID,
        mainHumanName: MINKA_NAME,
        mainHumanEmail: MINKA_EMAIL,
        enrolledAt: now,
        enrolledBy: MINKA_UID,
        status: 'active',
        checkedIn: true,
        checkedInAt: now,
        assignedStaff: [],
        serviceTypes: ['boarding'],
        internalTags: [],
      }
    );
  }

  // Daily reports: 5 days × 5 dogs = 25
  const reportDates = ['2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15', '2026-05-16'];
  const moods = ['great', 'good', 'okay'];
  const reportDogs = shelterDogNames.slice(0, 5);

  for (let d = 0; d < reportDates.length; d++) {
    for (let k = 0; k < 5; k++) {
      const dogId = `shelter-dog-${k + 1}`;
      const dogName = reportDogs[k];
      const reportId = `report-home-${d}-${k}`;
      await ab.set(
        db.collection('organizations').doc(homeId).collection('dailyReports').doc(reportId),
        {
          id: reportId,
          dogId,
          dogName,
          date: reportDates[d],
          summary: 'Good day overall. Ate well and played.',
          mood: moods[(d + k) % 3],
          activities: ['walk', 'feeding', 'playtime'],
          staffId: homeStaffIds[k % 10],
          staffName: homeStaffNames[k % 10],
          createdAt: dateTs(2026, 5, d + 12) + 18 * 3600_000,
        }
      );
    }
  }

  // ── The Vet (veterinary) ────────────────────────────────────────────────────

  const vetId = 'the-vet';
  const vetIds = ['vet-1', 'vet-2', 'vet-3', 'vet-4'];
  const vetNames = ['Dr. Oren Levi', 'Dr. Tal Rosen', 'Dr. Michal Dayan', 'Dr. Amir Zur'];
  const nurseIds = Array.from({ length: 10 }, (_, i) => `nurse-${i + 1}`);
  const nurseNames = [
    'Ronit Bar', 'Limor Gal', 'Shai Nave', 'Inbal Yam', 'Keren Sela',
    'Hila Baratz', 'Ofer Picard', 'Tali Gross', 'Maayan Avraham', 'Benny Ariel',
  ];

  await ab.set(db.collection('organizations').doc(vetId), {
    id: vetId,
    name: 'The Vet',
    type: 'veterinary',
    description: 'Professional veterinary care for all dogs',
    email: 'info@thevet.org',
    address: { street: '5 Medical Drive', city: 'Tel Aviv', country: 'Israel' },
    leaderUserIds: [MINKA_UID],
    staffUserIds: [...vetIds, ...nurseIds],
    createdBy: MINKA_UID,
    createdAt: now,
    updatedAt: now,
  });

  await ab.set(db.collection('organizations').doc(vetId).collection('members').doc(MINKA_UID), {
    userId: MINKA_UID,
    displayName: MINKA_NAME,
    email: MINKA_EMAIL,
    role: 'leader',
    joinedAt: now,
  });

  for (let i = 0; i < 4; i++) {
    await ab.set(db.collection('organizations').doc(vetId).collection('members').doc(vetIds[i]), {
      userId: vetIds[i],
      displayName: vetNames[i],
      email: `${vetNames[i].toLowerCase().replace(/[.\s]+/g, '.')}@thevet.org`,
      role: 'staff',
      staffRole: 'vet_tech',
      joinedAt: now,
      invitedBy: MINKA_UID,
    });
  }

  for (let i = 0; i < 10; i++) {
    await ab.set(db.collection('organizations').doc(vetId).collection('members').doc(nurseIds[i]), {
      userId: nurseIds[i],
      displayName: nurseNames[i],
      email: `${nurseNames[i].toLowerCase().replace(/\s+/g, '.')}@thevet.org`,
      role: 'staff',
      staffRole: 'receptionist',
      joinedAt: now,
      invitedBy: MINKA_UID,
    });
  }

  const vetDogNames = [
    'Max', 'Bella', 'Charlie', 'Lucy', 'Cooper',
    'Molly', 'Buddy', 'Daisy', 'Rocky', 'Maggie',
    'Duke', 'Sadie', 'Jack', 'Bailey', 'Toby',
    'Cleo', 'Zeus',
  ];

  for (let i = 1; i <= 17; i++) {
    const dogId = `vet-dog-${i}`;
    const dogName = vetDogNames[i - 1] ?? `Patient ${i}`;
    await ab.set(
      db.collection('organizations').doc(vetId).collection('enrolledDogs').doc(dogId),
      {
        dogId,
        dogName,
        mainHumanId: MINKA_UID,
        mainHumanName: MINKA_NAME,
        mainHumanEmail: MINKA_EMAIL,
        enrolledAt: now,
        enrolledBy: MINKA_UID,
        status: 'active',
        checkedIn: true,
        checkedInAt: now,
        assignedStaff: [],
        serviceTypes: ['vet_care'],
        internalTags: [],
      }
    );
  }

  // Daily reports: 5 days × 5 dogs = 25
  for (let d = 0; d < reportDates.length; d++) {
    for (let k = 0; k < 5; k++) {
      const dogId = `vet-dog-${k + 1}`;
      const dogName = vetDogNames[k];
      const reportId = `report-vet-${d}-${k}`;
      await ab.set(
        db.collection('organizations').doc(vetId).collection('dailyReports').doc(reportId),
        {
          id: reportId,
          dogId,
          dogName,
          date: reportDates[d],
          summary: 'Examination completed. Vitals normal.',
          mood: moods[(d + k) % 3],
          activities: ['check-up', 'vitals', 'weight'],
          staffId: vetIds[k % 4],
          staffName: vetNames[k % 4],
          createdAt: dateTs(2026, 5, d + 12) + 17 * 3600_000,
        }
      );
    }
  }

  // ── The Food Store (shop) ───────────────────────────────────────────────────

  const storeId = 'the-food-store';
  const workerIds = Array.from({ length: 5 }, (_, i) => `worker-${i + 1}`);
  const workerNames = ['Yuval Cohen', 'Merav Katz', 'Ido Shmueli', 'Tamar Ben-Ami', 'Gal Peretz'];
  const driverIds = Array.from({ length: 5 }, (_, i) => `driver-${i + 1}`);
  const driverNames = ['Nir Friedman', 'Orit Levi', 'Liron Shapiro', 'Dor Mizrahi', 'Yael Stern'];

  await ab.set(db.collection('organizations').doc(storeId), {
    id: storeId,
    name: 'The Food Store',
    type: 'shop',
    description: 'Premium pet food and supplies delivered to your door',
    email: 'orders@thefoodstore.co.il',
    address: { street: '22 Market Street', city: 'Tel Aviv', country: 'Israel' },
    leaderUserIds: [MINKA_UID],
    staffUserIds: [...workerIds, ...driverIds],
    createdBy: MINKA_UID,
    createdAt: now,
    updatedAt: now,
  });

  await ab.set(db.collection('organizations').doc(storeId).collection('members').doc(MINKA_UID), {
    userId: MINKA_UID,
    displayName: MINKA_NAME,
    email: MINKA_EMAIL,
    role: 'leader',
    joinedAt: now,
  });

  for (let i = 0; i < 5; i++) {
    await ab.set(db.collection('organizations').doc(storeId).collection('members').doc(workerIds[i]), {
      userId: workerIds[i],
      displayName: workerNames[i],
      email: `${workerNames[i].toLowerCase().replace(/\s+/g, '.')}@thefoodstore.co.il`,
      role: 'staff',
      staffRole: 'other',
      joinedAt: now,
      invitedBy: MINKA_UID,
    });
  }

  for (let i = 0; i < 5; i++) {
    await ab.set(db.collection('organizations').doc(storeId).collection('members').doc(driverIds[i]), {
      userId: driverIds[i],
      displayName: driverNames[i],
      email: `${driverNames[i].toLowerCase().replace(/\s+/g, '.')}@thefoodstore.co.il`,
      role: 'staff',
      staffRole: 'walker',
      joinedAt: now,
      invitedBy: MINKA_UID,
    });
  }

  // 15 delivery tasks
  const telAvivAddresses = [
    '3 Rothschild Blvd', '17 Ibn Gabirol St', '45 Ben Yehuda St',
    '8 Dizengoff St', '22 King George St', '11 Allenby St',
    '5 HaYarkon St', '30 Basel St', '14 Frishman St',
    '2 Nordau Blvd', '9 Trumpeldor St', '27 Weizmann St',
    '6 Einstein St', '19 Masaryk Sq', '1 Nahalat Binyamin',
  ];
  const taskStatuses: Array<'done' | 'in_progress' | 'pending'> = [
    'done', 'done', 'done', 'done', 'done', 'done', 'done', 'done',
    'in_progress', 'in_progress', 'in_progress', 'in_progress', 'in_progress',
    'pending', 'pending',
  ];
  const todayTs = dateTs(2026, 5, 16);

  for (let i = 1; i <= 15; i++) {
    const taskId = `task-store-${i}`;
    const driverId = driverIds[(i - 1) % 5];
    const driverName = driverNames[(i - 1) % 5];
    const status = taskStatuses[i - 1];
    await ab.set(
      db.collection('organizations').doc(storeId).collection('tasks').doc(taskId),
      {
        id: taskId,
        dogId: `delivery-${i}`,
        dogName: `Order #${String(i).padStart(3, '0')}`,
        title: `Deliver to ${telAvivAddresses[i - 1]}`,
        type: 'walk',
        assignedTo: driverId,
        assignedToName: driverName,
        assignedBy: MINKA_UID,
        assignedByName: MINKA_NAME,
        dueAt: todayTs + 17 * 3600_000,
        status,
        notes: `Package for ${telAvivAddresses[i - 1]}`,
        createdAt: now,
        updatedAt: now,
      }
    );
  }

  await ab.flush();
  console.log('✅ Orgs seeded');
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
    { userId: 'caregiver-org', displayName: 'Minka Mishleni', email: 'minka@mishleni.com',          role: 'caregiver' },
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
  await seedOrgs();
  await seedBiscuit();
  console.log('✅ Seed complete!');
}

seedAll().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
