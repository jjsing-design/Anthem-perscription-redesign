import { DAY_MS, systemClock } from './clock';

export const user = {
  firstName: 'Jordan',
  lastName: 'Ellis',
  memberId: 'XAH8846210',
  planName: 'Anthem Blue Access PPO',
};

// PLACEHOLDER / SIMULATED DATA: NOT A REAL SUPPORT LINE.
// The help text ("Still not working? Call [number] ...") needs a number the
// rules do not give. 555-01xx numbers are reserved for fiction. Replace with
// the real member services number before any real use.
export const PLACEHOLDER_SUPPORT_PHONE = '1-800-555-0100';

export const pharmacyPlan = {
  name: 'Pharmacy benefit',
  year: 2026,
  deductibleMet: 250,
  deductibleMax: 500,
  oopMet: 1200,
  oopMax: 3000,
};

export const pharmacies = [
  { id: 'cvs', name: 'CVS Pharmacy', detail: 'Colfax Ave', distance: '0.4 mi', type: 'retail' },
  { id: 'walgreens', name: 'Walgreens', detail: 'Colorado Blvd', distance: '1.1 mi', type: 'retail' },
  { id: 'mail', name: 'Anthem Home Delivery', detail: 'Mail order', distance: 'Ships to you', type: 'mail' },
];

export const claims = [
  {
    id: 'claim-1',
    title: 'Office visit',
    provider: 'Dr. Priya Shah',
    date: '2026-09-28',
    amount: 40,
    status: 'paid',
  },
  {
    id: 'claim-2',
    title: 'Lab work',
    provider: 'Quest Diagnostics',
    date: '2026-10-01',
    amount: 18,
    status: 'pending',
  },
  {
    id: 'claim-3',
    title: 'Urgent care',
    provider: 'Denver Urgent Care',
    date: '2026-08-12',
    amount: 150,
    status: 'denied',
  },
];

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// Local calendar date as 'YYYY-MM-DD'.
export function toIsoDate(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseIsoDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(iso) {
  return parseIsoDate(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function expectedDate(delivery, today = new Date()) {
  const date = startOfDay(today);
  date.setDate(date.getDate() + (delivery === 'home' ? 5 : 1));
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Same timing as expectedDate (pickup next day, home delivery in 5 days),
// as an ISO date for the request record's expected update date.
export function expectedUpdateDate(delivery, now = new Date()) {
  return toIsoDate(addDays(startOfDay(now), delivery === 'home' ? 5 : 1));
}

// ---------------------------------------------------------------------------
// Seed data. Dates are relative to "now" so the sample always shows one
// medication in each state: normal, Low, Pending, Not sent.
// ---------------------------------------------------------------------------

export function createSeedData(now = systemClock.now()) {
  const today = startOfDay(now);
  const daysAgo = (n) => toIsoDate(addDays(today, -n));
  const daysFromNow = (n) => toIsoDate(addDays(today, n));

  const prescriptions = [
    {
      // NORMAL: 90 tablets at 1/day, filled 80 days ago -> runs out in 10 days.
      id: 'rx-atorvastatin',
      name: 'Atorvastatin',
      dosage: '20 mg',
      form: 'Tablet',
      quantity: 90,
      dailyDose: 1,
      daysSupply: 90,
      refillsRemaining: 3,
      prescriber: 'Dr. Priya Shah',
      lastRefilled: daysAgo(80),
      nextRefillDate: daysAgo(5),
      medicationCost: 62.4,
      planPays: 49.9,
    },
    {
      // LOW: 30 tablets at 1/day, filled 26 days ago -> runs out in 4 days.
      id: 'rx-lisinopril',
      name: 'Lisinopril',
      dosage: '10 mg',
      form: 'Tablet',
      quantity: 30,
      dailyDose: 1,
      daysSupply: 30,
      refillsRemaining: 5,
      prescriber: 'Dr. Priya Shah',
      lastRefilled: daysAgo(26),
      nextRefillDate: daysAgo(3),
      medicationCost: 36,
      planPays: 28,
    },
    {
      // PENDING: has an open request (below). Also within 7 days of run-out,
      // so it shows Pending over Low (status priority).
      id: 'rx-metformin',
      name: 'Metformin',
      dosage: '500 mg',
      form: 'Tablet',
      quantity: 60,
      dailyDose: 2,
      daysSupply: 30,
      refillsRemaining: 2,
      prescriber: 'Dr. Priya Shah',
      lastRefilled: daysAgo(27),
      nextRefillDate: daysAgo(4),
      medicationCost: 18.25,
      planPays: 14,
    },
    {
      // NOT SENT: a failed attempt 2 hours ago (below). Also within 7 days of
      // run-out, so it shows Not sent over Low (status priority).
      id: 'rx-levothyroxine',
      name: 'Levothyroxine',
      dosage: '50 mcg',
      form: 'Tablet',
      quantity: 30,
      dailyDose: 1,
      daysSupply: 30,
      refillsRemaining: 4,
      prescriber: 'Dr. Priya Shah',
      lastRefilled: daysAgo(25),
      nextRefillDate: daysAgo(2),
      medicationCost: 15,
      planPays: 11,
    },
    {
      // NEEDS A REFILL: 30 tablets at 1/day, filled 33 days ago -> ran out
      // 3 days ago.
      id: 'rx-amlodipine',
      name: 'Amlodipine',
      dosage: '5 mg',
      form: 'Tablet',
      quantity: 30,
      dailyDose: 1,
      daysSupply: 30,
      refillsRemaining: 3,
      prescriber: 'Dr. Priya Shah',
      lastRefilled: daysAgo(33),
      nextRefillDate: daysAgo(10),
      medicationCost: 24,
      planPays: 19,
    },
  ];

  // Refill request records.
  const refillRequests = [
    {
      requestId: 'req-seed-metformin',
      prescriptionId: 'rx-metformin',
      status: 'processing',
      submittedAt: addDays(now, -1).toISOString(),
      expectedUpdate: daysFromNow(1),
      pharmacyId: 'cvs',
      delivery: 'pickup',
    },
  ];

  // Per-prescription failed-attempt records (known failures only).
  // firstFailedAt starts the 24-hour Not-sent window; failedAt is the latest.
  const twoHoursAgo = new Date(new Date(now).getTime() - 2 * 60 * 60 * 1000).toISOString();
  const failedAttempts = [
    {
      prescriptionId: 'rx-levothyroxine',
      requestId: 'req-seed-levothyroxine',
      firstFailedAt: twoHoursAgo,
      failedAt: twoHoursAgo,
      failure: 'pharmacy_unreachable',
      attempts: 1,
      pharmacyId: 'cvs',
      delivery: 'pickup',
    },
  ];

  return { prescriptions, refillRequests, failedAttempts };
}

const seed = createSeedData();
export const prescriptions = seed.prescriptions;
export const refillRequests = seed.refillRequests;
export const failedAttempts = seed.failedAttempts;

// ---------------------------------------------------------------------------
// Branch A: open requests
// ---------------------------------------------------------------------------

// End states: delivered (delivery), ready for pickup (pickup), cancelled, failed.
export const REQUEST_END_STATES = ['delivered', 'ready_for_pickup', 'cancelled', 'failed'];

export function isRequestOpen(request) {
  return Boolean(request) && !REQUEST_END_STATES.includes(request.status);
}

export function findOpenRequest(prescriptionId, requests = []) {
  return requests.find((req) => req.prescriptionId === prescriptionId && isRequestOpen(req)) ?? null;
}

// ---------------------------------------------------------------------------
// Branch B: Not sent (clears on successful retry, or 24 hours after the
// FIRST failed attempt, whichever comes first; later failures do not
// restart the clock)
// ---------------------------------------------------------------------------

export const NOT_SENT_WINDOW_MS = DAY_MS;

export function notSentWindowStart(attempt) {
  return attempt.firstFailedAt ?? attempt.failedAt;
}

export function isNotSentActive(attempt, now = new Date()) {
  if (!attempt) return false;
  const age = new Date(now).getTime() - new Date(notSentWindowStart(attempt)).getTime();
  return age >= 0 && age < NOT_SENT_WINDOW_MS;
}

// The failed-attempt record after another known failure. Within an active
// window it keeps the first failure's time; otherwise a new window starts.
export function recordFailedAttempt(previous, { prescriptionId, requestId, failure, pharmacyId, delivery, attempts, now }) {
  const at = new Date(now).toISOString();
  const continuing = previous && isNotSentActive(previous, now);
  return {
    prescriptionId,
    requestId,
    firstFailedAt: continuing ? notSentWindowStart(previous) : at,
    failedAt: at,
    failure,
    attempts,
    pharmacyId,
    delivery,
  };
}

export function findActiveFailedAttempt(prescriptionId, attempts = [], now = new Date()) {
  return (
    attempts.find((attempt) => attempt.prescriptionId === prescriptionId && isNotSentActive(attempt, now)) ?? null
  );
}

// ---------------------------------------------------------------------------
// Supply: run-out date = last fill date + (quantity / daily dose) days.
// Needs a refill: the run-out date is today or earlier.
// Low: the run-out date is 1-7 days away.
// ---------------------------------------------------------------------------

export const LOW_WINDOW_DAYS = 7;

// Partial days of supply round down (decision log 3).
export function runOutDate(rx) {
  const days = Math.floor(rx.quantity / rx.dailyDose);
  return addDays(parseIsoDate(rx.lastRefilled), days);
}

export function daysUntilRunOut(rx, now = new Date()) {
  return Math.round((startOfDay(runOutDate(rx)).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

// "Has passed" = run-out date is today or earlier (round-2 operator note).
export function needsRefill(rx, now = new Date()) {
  return daysUntilRunOut(rx, now) <= 0;
}

// The run-out date has NOT passed and is within 7 days.
export function isLow(rx, now = new Date()) {
  const days = daysUntilRunOut(rx, now);
  return days >= 1 && days <= LOW_WINDOW_DAYS;
}

// ---------------------------------------------------------------------------
// Status priority: Not sent -> Pending -> Needs a refill -> Low -> normal.
// "normal" keeps the prototype's existing labels: Refill Available / Active.
//
// Server wins (decision log 20): when the app knows of an open server-side
// request, it shows Pending even if this device holds a Not-sent record.
// Every open request the app knows of came from the server (seed data or a
// server response), so a known open request always overrides Not sent.
// ---------------------------------------------------------------------------

export function getRxStatus(rx, { now = new Date(), requests = [], failedAttempts: attempts = [] } = {}) {
  const openRequest = findOpenRequest(rx.id, requests);
  if (!openRequest && findActiveFailedAttempt(rx.id, attempts, now)) return 'not_sent';
  if (openRequest) return 'pending';
  if (needsRefill(rx, now)) return 'needs_refill';
  if (isLow(rx, now)) return 'low';
  return isRefillDue(rx, now) ? 'refill_available' : 'active';
}

// Existing prototype rule, unchanged: refill opens on nextRefillDate.
export function isRefillDue(rx, now = new Date()) {
  return startOfDay(parseIsoDate(rx.nextRefillDate)) <= startOfDay(now);
}

export function canRefill(rx, context = {}) {
  const status = getRxStatus(rx, context);
  if (status === 'not_sent') return true;
  if (status === 'pending') return false;
  return isRefillDue(rx, context.now ?? new Date());
}

export function refillHelper(rx, context = {}) {
  const status = getRxStatus(rx, context);
  if (status === 'pending') {
    const request = findOpenRequest(rx.id, context.requests);
    return `Refill requested ${formatDate(toIsoDate(request.submittedAt))}. Expected update ${formatDate(request.expectedUpdate)}.`;
  }
  if (status === 'not_sent') return '';
  if (!isRefillDue(rx, context.now ?? new Date())) return `Available ${formatDate(rx.nextRefillDate)}`;
  return '';
}

// ---------------------------------------------------------------------------
// Duplicate prevention: request ID generated on the device at confirm.
// ---------------------------------------------------------------------------

export function generateRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `req-${crypto.randomUUID()}`;
  }
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Cost
// ---------------------------------------------------------------------------

export const HOME_DELIVERY_FEE = 4.99;

export function costBreakdown(rx, delivery = 'pickup') {
  const deliveryFee = delivery === 'home' ? HOME_DELIVERY_FEE : 0;
  const youPay = Math.round((rx.medicationCost - rx.planPays + deliveryFee) * 100) / 100;
  return {
    medicationCost: rx.medicationCost,
    planPays: rx.planPays,
    deliveryFee,
    youPay,
  };
}

export function money(amount) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
