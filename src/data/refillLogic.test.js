import { describe, expect, it } from 'vitest';
import { DAY_MS, HOUR_MS, createTestClock } from './clock';
import {
  canRefill,
  createSeedData,
  getRxStatus,
  isLow,
  isNotSentActive,
  isRequestOpen,
  needsRefill,
  recordFailedAttempt,
} from './mockData';
import { createAppServer, createRefillServer, simulationFromSearch } from './refillServer';

const NOW = new Date(2026, 10, 18, 10, 0, 0);

function ctx(seed, now = NOW) {
  return { now, requests: seed.refillRequests, failedAttempts: seed.failedAttempts };
}

describe('seed data', () => {
  it('has one medication in each state: normal, Low, Needs a refill, Pending, Not sent', () => {
    const seed = createSeedData(NOW);
    const statuses = Object.fromEntries(seed.prescriptions.map((rx) => [rx.id, getRxStatus(rx, ctx(seed))]));
    expect(statuses).toEqual({
      'rx-atorvastatin': 'refill_available',
      'rx-lisinopril': 'low',
      'rx-amlodipine': 'needs_refill',
      'rx-metformin': 'pending',
      'rx-levothyroxine': 'not_sent',
    });
  });
});

describe('status priority: Not sent -> Pending -> Needs a refill -> Low -> normal', () => {
  const seed = createSeedData(NOW);
  const metformin = seed.prescriptions.find((rx) => rx.id === 'rx-metformin');
  const amlodipine = seed.prescriptions.find((rx) => rx.id === 'rx-amlodipine');
  const notSent = (id) => [{ prescriptionId: id, firstFailedAt: NOW.toISOString(), failedAt: NOW.toISOString(), attempts: 1 }];
  const openRequest = (id) => [{ requestId: 'r', prescriptionId: id, status: 'submitted', submittedAt: NOW.toISOString(), expectedUpdate: '2026-11-19' }];

  it('Pending outranks Low', () => {
    expect(isLow(metformin, NOW)).toBe(true);
    expect(getRxStatus(metformin, ctx(seed))).toBe('pending');
  });

  it('Pending outranks Needs a refill', () => {
    expect(getRxStatus(amlodipine, { now: NOW, requests: openRequest('rx-amlodipine'), failedAttempts: [] })).toBe('pending');
  });

  it('Not sent outranks Needs a refill', () => {
    expect(getRxStatus(amlodipine, { now: NOW, requests: [], failedAttempts: notSent('rx-amlodipine') })).toBe('not_sent');
  });

  // Round 2, Change 2 (server wins). Replaces round 1's "Not sent outranks
  // Pending", which asserted the opposite.
  it('a known open server request overrides a local Not sent: Pending, Refill disabled', () => {
    const context = { ...ctx(seed), failedAttempts: notSent('rx-metformin') };
    expect(getRxStatus(metformin, context)).toBe('pending');
    expect(canRefill(metformin, context)).toBe(false);
  });
});

describe('Low and Needs a refill', () => {
  const rx = { quantity: 30, dailyDose: 1, lastRefilled: '2026-11-01', nextRefillDate: '2026-11-01' };
  // run-out = Nov 1 + 30 days = Dec 1
  it('is Low exactly 7 days before run-out, not 8', () => {
    expect(isLow(rx, new Date(2026, 10, 24))).toBe(true);
    expect(isLow(rx, new Date(2026, 10, 23))).toBe(false);
  });

  it('is Low 1 day before run-out; Needs a refill on the run-out day and after', () => {
    const context = (date) => ({ now: date, requests: [], failedAttempts: [] });
    expect(getRxStatus(rx, context(new Date(2026, 10, 30)))).toBe('low');
    expect(getRxStatus(rx, context(new Date(2026, 11, 1)))).toBe('needs_refill');
    expect(getRxStatus(rx, context(new Date(2026, 11, 20)))).toBe('needs_refill');
    expect(isLow(rx, new Date(2026, 11, 1))).toBe(false);
  });

  it('partial days round down: 45 at 2/day is 22 days', () => {
    const half = { quantity: 45, dailyDose: 2, lastRefilled: '2026-11-01', nextRefillDate: '2026-11-01' };
    expect(needsRefill(half, new Date(2026, 10, 23))).toBe(true);
    expect(needsRefill(half, new Date(2026, 10, 22))).toBe(false);
  });
});

describe('24-hour window runs from the FIRST failure', () => {
  const first = new Date(NOW);
  const base = { prescriptionId: 'rx-1', requestId: 'a', failure: 'not_sent', pharmacyId: 'cvs', delivery: 'pickup' };

  it('a later failure inside the window keeps the first failure time', () => {
    const one = recordFailedAttempt(null, { ...base, attempts: 1, now: first });
    const two = recordFailedAttempt(one, { ...base, attempts: 2, now: new Date(first.getTime() + 20 * HOUR_MS) });
    expect(two.firstFailedAt).toBe(first.toISOString());
    expect(isNotSentActive(two, new Date(first.getTime() + DAY_MS - 1))).toBe(true);
    expect(isNotSentActive(two, new Date(first.getTime() + DAY_MS))).toBe(false);
  });

  it('a failure after the window has expired starts a new window', () => {
    const one = recordFailedAttempt(null, { ...base, attempts: 1, now: first });
    const later = new Date(first.getTime() + DAY_MS + HOUR_MS);
    const two = recordFailedAttempt(one, { ...base, attempts: 1, now: later });
    expect(two.firstFailedAt).toBe(later.toISOString());
  });
});

describe('Not sent 24-hour expiry', () => {
  const attempt = { failedAt: NOW.toISOString() };
  it('is active just under 24h and clears at 24h', () => {
    expect(isNotSentActive(attempt, new Date(NOW.getTime() + DAY_MS - 1))).toBe(true);
    expect(isNotSentActive(attempt, new Date(NOW.getTime() + DAY_MS))).toBe(false);
  });

  it('returns the medication to its normal status and enables Refill', () => {
    const seed = createSeedData(NOW);
    const levo = seed.prescriptions.find((rx) => rx.id === 'rx-levothyroxine');
    // seed failed 2h before NOW; 22h later it has expired
    const later = new Date(NOW.getTime() + 22 * HOUR_MS);
    expect(getRxStatus(levo, ctx(seed, later))).toBe('low');
    expect(canRefill(levo, ctx(seed, NOW))).toBe(true);
  });
});

describe('Branch A: open requests', () => {
  it('end states are not open', () => {
    for (const status of ['delivered', 'ready_for_pickup', 'cancelled', 'failed']) {
      expect(isRequestOpen({ status })).toBe(false);
    }
    expect(isRequestOpen({ status: 'submitted' })).toBe(true);
  });

  it('Pending disables Refill', () => {
    const seed = createSeedData(NOW);
    const metformin = seed.prescriptions.find((rx) => rx.id === 'rx-metformin');
    expect(canRefill(metformin, ctx(seed))).toBe(false);
  });
});

describe('simulated server', () => {
  const pharmacy = { id: 'cvs', name: 'CVS Pharmacy' };
  const clock = createTestClock(NOW);

  it('rejects a second request while one is open', async () => {
    const server = createRefillServer({ clock, latencyMs: 0 });
    const first = await server.submitRefill({ requestId: 'a', prescriptionId: 'rx-1', pharmacy, delivery: 'pickup' });
    const second = await server.submitRefill({ requestId: 'b', prescriptionId: 'rx-1', pharmacy, delivery: 'pickup' });
    expect(first.status).toBe('created');
    expect(second.status).toBe('duplicate');
    expect(second.request.requestId).toBe('a');
    expect(server.getRequests()).toHaveLength(1);
  });

  it('same request ID never creates a second request', async () => {
    const server = createRefillServer({ clock, latencyMs: 0 });
    await server.submitRefill({ requestId: 'a', prescriptionId: 'rx-1', pharmacy, delivery: 'pickup' });
    const replay = await server.submitRefill({ requestId: 'a', prescriptionId: 'rx-1', pharmacy, delivery: 'pickup' });
    expect(replay.status).toBe('existing');
    expect(server.getRequests()).toHaveLength(1);
  });

  it('known failures store nothing; retry with the same ID then succeeds once', async () => {
    const server = createRefillServer({ clock, latencyMs: 0, simulation: { connectionFailures: 1 } });
    const failed = await server.submitRefill({ requestId: 'a', prescriptionId: 'rx-1', pharmacy, delivery: 'pickup' });
    expect(failed).toMatchObject({ status: 'failed', failure: 'not_sent' });
    expect(server.getRequests()).toHaveLength(0);
    const retry = await server.submitRefill({ requestId: 'a', prescriptionId: 'rx-1', pharmacy, delivery: 'pickup' });
    expect(retry.status).toBe('created');
    expect(server.getRequests()).toHaveLength(1);
  });

  it('pharmacy unreachable only for that pharmacy', async () => {
    const server = createRefillServer({ clock, latencyMs: 0, simulation: { unreachablePharmacyIds: ['cvs'] } });
    const failed = await server.submitRefill({ requestId: 'a', prescriptionId: 'rx-1', pharmacy, delivery: 'pickup' });
    expect(failed.failure).toBe('pharmacy_unreachable');
    const other = await server.submitRefill({
      requestId: 'a',
      prescriptionId: 'rx-1',
      pharmacy: { id: 'walgreens', name: 'Walgreens' },
      delivery: 'pickup',
    });
    expect(other.status).toBe('created');
  });

  it('?simulate=duplicate seeds server-only open requests for Atorvastatin and the Not-sent Levothyroxine', () => {
    const server = createAppServer({ clock, requests: [], search: '?simulate=duplicate' });
    expect(server.getRequests().map((req) => req.prescriptionId).sort()).toEqual(['rx-atorvastatin', 'rx-levothyroxine']);
  });

  it('no URL flag means no simulated failure', () => {
    expect(simulationFromSearch('')).toEqual({
      simulation: { unreachablePharmacyIds: [], connectionFailures: 0 },
      seedDuplicate: false,
    });
  });
});
