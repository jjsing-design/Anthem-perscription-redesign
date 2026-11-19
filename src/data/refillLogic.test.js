import { describe, expect, it } from 'vitest';
import { DAY_MS, HOUR_MS, createTestClock } from './clock';
import {
  canRefill,
  createSeedData,
  getRxStatus,
  isLow,
  isNotSentActive,
  isRequestOpen,
} from './mockData';
import { createRefillServer, simulationFromSearch } from './refillServer';

const NOW = new Date(2026, 10, 18, 10, 0, 0);

function ctx(seed, now = NOW) {
  return { now, requests: seed.refillRequests, failedAttempts: seed.failedAttempts };
}

describe('seed data', () => {
  it('has one medication in each state: normal, Low, Pending, Not sent', () => {
    const seed = createSeedData(NOW);
    const statuses = Object.fromEntries(seed.prescriptions.map((rx) => [rx.id, getRxStatus(rx, ctx(seed))]));
    expect(statuses).toEqual({
      'rx-atorvastatin': 'refill_available',
      'rx-lisinopril': 'low',
      'rx-metformin': 'pending',
      'rx-levothyroxine': 'not_sent',
    });
  });
});

describe('status priority: Not sent -> Pending -> Low -> normal', () => {
  const seed = createSeedData(NOW);
  const metformin = seed.prescriptions.find((rx) => rx.id === 'rx-metformin');

  it('Pending outranks Low', () => {
    expect(isLow(metformin, NOW)).toBe(true);
    expect(getRxStatus(metformin, ctx(seed))).toBe('pending');
  });

  it('Not sent outranks Pending', () => {
    const attempts = [{ prescriptionId: 'rx-metformin', failedAt: NOW.toISOString(), attempts: 1 }];
    expect(getRxStatus(metformin, { ...ctx(seed), failedAttempts: attempts })).toBe('not_sent');
  });
});

describe('Low', () => {
  const rx = { quantity: 30, dailyDose: 1, lastRefilled: '2026-11-01', nextRefillDate: '2026-11-01' };
  // run-out = Nov 1 + 30 days = Dec 1
  it('is Low exactly 7 days before run-out, not 8', () => {
    expect(isLow(rx, new Date(2026, 10, 24))).toBe(true);
    expect(isLow(rx, new Date(2026, 10, 23))).toBe(false);
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

  it('no URL flag means no simulated failure', () => {
    expect(simulationFromSearch('')).toEqual({
      simulation: { unreachablePharmacyIds: [], connectionFailures: 0 },
      seedDuplicate: false,
    });
  });
});
