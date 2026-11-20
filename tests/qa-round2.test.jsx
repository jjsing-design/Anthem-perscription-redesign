// Round-2 QA tests (dev-qa) against commit 97c25ff.
// Case numbers match round-2 BRIEF 3. Round-1 cases stay in qa-exception-paths.test.jsx.

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { DAY_MS, HOUR_MS, createTestClock } from '../src/data/clock';
import {
  addDays,
  canRefill,
  createSeedData,
  getRxStatus,
  isLow,
  needsRefill,
  pharmacyPlan,
  recordFailedAttempt,
  startOfDay,
  toIsoDate,
} from '../src/data/mockData';
import { createRefillServer } from '../src/data/refillServer';
import PharmacyScreen from '../src/screens/PharmacyScreen';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.history.replaceState({}, '', '/');
});

const NOW = new Date(2026, 10, 18, 10, 0, 0);
const NOT_SENT = 'Not sent. Try again';

// A test prescription whose run-out date is `runOutInDays` from NOW (negative = passed).
// quantity 30 at 1/day, refill gate open.
function rxRunningOut(runOutInDays, overrides = {}) {
  return {
    id: 'rx-test',
    name: 'Testamine',
    dosage: '10 mg',
    form: 'Tablet',
    quantity: 30,
    dailyDose: 1,
    daysSupply: 30,
    refillsRemaining: 2,
    prescriber: 'Dr. Test',
    lastRefilled: toIsoDate(addDays(startOfDay(NOW), runOutInDays - 30)),
    nextRefillDate: toIsoDate(addDays(startOfDay(NOW), -60)),
    medicationCost: 10,
    planPays: 5,
    ...overrides,
  };
}

const openRequest = (prescriptionId, extra = {}) => ({
  requestId: `req-open-${prescriptionId}`,
  prescriptionId,
  status: 'submitted',
  submittedAt: NOW.toISOString(),
  expectedUpdate: '2026-11-19',
  pharmacyId: 'cvs',
  delivery: 'pickup',
  ...extra,
});

const failed = (prescriptionId, at = NOW) => ({
  prescriptionId,
  requestId: `req-failed-${prescriptionId}`,
  firstFailedAt: at.toISOString(),
  failedAt: at.toISOString(),
  failure: 'not_sent',
  attempts: 1,
  pharmacyId: 'cvs',
  delivery: 'pickup',
});

function renderList(prescriptions, context) {
  render(<PharmacyScreen plan={pharmacyPlan} prescriptions={prescriptions} statusContext={context} onRefill={vi.fn()} />);
}

function setup(simulation = {}) {
  const clock = createTestClock(NOW);
  const seed = createSeedData(NOW);
  const server = createRefillServer({ clock, requests: seed.refillRequests, latencyMs: 0, simulation });
  render(<App clock={clock} server={server} initialRoute="pharmacy" />);
  return { clock, server };
}

const row = (name) => screen.getByRole('heading', { name }).closest('article');
const badge = (name) => within(row(name));
const refillButton = (name) => within(row(name)).getByRole('button', { name: `Refill ${name}` });
const confirmButton = () => screen.getByRole('button', { name: 'Confirm refill' });
const settle = () => act(async () => {});
const goToPharmacy = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Home' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pharmacy' }));
};
async function failOnce(name) {
  fireEvent.click(refillButton(name));
  fireEvent.click(confirmButton());
  await settle();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
}

// ---------------------------------------------------------------------------
describe('Case 1: Needs a refill boundary', () => {
  it.each([
    ['yesterday', -1, 'needs_refill', 'Needs a refill'],
    ['today', 0, 'needs_refill', 'Needs a refill'],
    ['tomorrow', 1, 'low', 'Low'],
  ])('run-out %s -> %s (status logic and list text)', (_label, days, status, text) => {
    const rx = rxRunningOut(days);
    const context = { now: NOW, requests: [], failedAttempts: [] };
    expect(getRxStatus(rx, context)).toBe(status);
    renderList([rx], context);
    expect(badge('Testamine').getByText(text)).toBeTruthy();
  });

  it('time of day does not matter: run-out today at 23:59 is Needs a refill; the day before at 23:59 is Low', () => {
    const late = new Date(2026, 10, 18, 23, 59, 0);
    expect(getRxStatus(rxRunningOut(0), { now: late })).toBe('needs_refill');
    expect(getRxStatus(rxRunningOut(1), { now: late })).toBe('low');
  });

  it('journey: Lisinopril (runs out in 4 days) shows Low at day +3 and Needs a refill at day +4', () => {
    const { clock } = setup();
    expect(badge('Lisinopril').getByText('Low')).toBeTruthy();
    clock.advance(3 * DAY_MS);
    goToPharmacy();
    expect(badge('Lisinopril').getByText('Low')).toBeTruthy();
    clock.advance(DAY_MS);
    goToPharmacy();
    expect(badge('Lisinopril').getByText('Needs a refill')).toBeTruthy();
    expect(badge('Lisinopril').queryByText('Low')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
describe('Case 2: Low boundary unchanged', () => {
  it('7 days before run-out is Low; 8 days is normal', () => {
    const context = { now: NOW, requests: [], failedAttempts: [] };
    expect(getRxStatus(rxRunningOut(7), context)).toBe('low');
    expect(getRxStatus(rxRunningOut(8), context)).toBe('refill_available');
    renderList([rxRunningOut(7, { id: 'a', name: 'Seven' }), rxRunningOut(8, { id: 'b', name: 'Eight' })], context);
    expect(badge('Seven').getByText('Low')).toBeTruthy();
    expect(badge('Eight').getByText('Refill Available')).toBeTruthy();
    expect(badge('Eight').queryByText('Low')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
describe('Case 3: partial days round down', () => {
  // 45 tablets at 2/day = 22.5 days -> 22. Filled on day L, runs out on L+22.
  const L = startOfDay(addDays(NOW, -22));
  const rx = rxRunningOut(0, { quantity: 45, dailyDose: 2, lastRefilled: toIsoDate(L) });
  const on = (offset) => addDays(L, offset);

  it('45 at 2/day: day L+22 is Needs a refill (round-up would say Low)', () => {
    expect(needsRefill(rx, on(22))).toBe(true);
    expect(getRxStatus(rx, { now: on(22) })).toBe('needs_refill');
  });

  it('45 at 2/day: day L+21 is Low (1 day left)', () => {
    expect(getRxStatus(rx, { now: on(21) })).toBe('low');
  });

  it('45 at 2/day: day L+15 is Low (7 days), L+14 is normal (8 days); round-up would shift both', () => {
    expect(isLow(rx, on(15))).toBe(true);
    expect(isLow(rx, on(14))).toBe(false);
  });

  it('10 at 3/day = 3.33 days -> 3: day L+3 is Needs a refill, L+2 is Low', () => {
    const small = rxRunningOut(0, { quantity: 10, dailyDose: 3, lastRefilled: toIsoDate(L) });
    expect(getRxStatus(small, { now: on(3) })).toBe('needs_refill');
    expect(getRxStatus(small, { now: on(2) })).toBe('low');
  });
});

// ---------------------------------------------------------------------------
describe('Case 4: an overdue medication never displays Low', () => {
  it('for every day from run-out to 90 days past, status is Needs a refill and isLow is false', () => {
    for (let d = 0; d >= -90; d -= 1) {
      const rx = rxRunningOut(d);
      expect(isLow(rx, NOW)).toBe(false);
      expect(getRxStatus(rx, { now: NOW })).toBe('needs_refill');
    }
  });

  it('seeded Amlodipine (ran out 3 days ago) shows Needs a refill and no Low in the list', () => {
    setup();
    expect(badge('Amlodipine').getByText('Needs a refill')).toBeTruthy();
    expect(badge('Amlodipine').queryByText('Low')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
describe('Case 5: Pending beats Needs a refill', () => {
  it('overdue + open request: Pending, request date + expected update, Refill disabled', () => {
    const rx = rxRunningOut(-3);
    const context = { now: NOW, requests: [openRequest('rx-test')], failedAttempts: [] };
    expect(getRxStatus(rx, context)).toBe('pending');
    renderList([rx], context);
    expect(badge('Testamine').getByText('Pending')).toBeTruthy();
    expect(badge('Testamine').queryByText('Needs a refill')).toBeNull();
    expect(row('Testamine').textContent).toMatch(/Refill requested Nov 18, 2026\. Expected update Nov 19, 2026\./);
    expect(refillButton('Testamine').disabled).toBe(true);
  });

  it('journey: refill Amlodipine successfully -> row shows Pending', async () => {
    setup();
    fireEvent.click(refillButton('Amlodipine'));
    fireEvent.click(confirmButton());
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(badge('Amlodipine').getByText('Pending')).toBeTruthy();
    expect(badge('Amlodipine').queryByText('Needs a refill')).toBeNull();
    expect(refillButton('Amlodipine').disabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
describe('Case 6: Not sent beats Needs a refill (no open server request)', () => {
  it('logic: overdue + failed attempt, no request -> not_sent, Refill enabled', () => {
    const rx = rxRunningOut(-3);
    const context = { now: NOW, requests: [], failedAttempts: [failed('rx-test')] };
    expect(getRxStatus(rx, context)).toBe('not_sent');
    expect(canRefill(rx, context)).toBe(true);
  });

  it('journey: Amlodipine connection failure -> list shows Not sent, not Needs a refill; Refill enabled', async () => {
    const { server } = setup({ connectionFailures: 1 });
    await failOnce('Amlodipine');
    expect(server.getRequests().filter((r) => r.prescriptionId === 'rx-amlodipine')).toHaveLength(0);
    expect(badge('Amlodipine').getByText(NOT_SENT)).toBeTruthy();
    expect(badge('Amlodipine').queryByText('Needs a refill')).toBeNull();
    expect(refillButton('Amlodipine').disabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe('Case 7: server wins over a local Not sent', () => {
  it('list: Not sent record + known open request -> Pending, request date + expected update, Refill disabled', () => {
    const seed = createSeedData(NOW);
    const context = {
      now: NOW,
      requests: [...seed.refillRequests, openRequest('rx-levothyroxine')],
      failedAttempts: seed.failedAttempts, // Levothyroxine Not sent, 2h old
    };
    renderList(seed.prescriptions, context);
    expect(badge('Levothyroxine').getByText('Pending')).toBeTruthy();
    expect(badge('Levothyroxine').queryByText(NOT_SENT)).toBeNull();
    expect(row('Levothyroxine').textContent).toMatch(/Refill requested Nov 18, 2026\. Expected update Nov 19, 2026\./);
    expect(refillButton('Levothyroxine').disabled).toBe(true);
  });

  it('overdue + Not sent + open request -> Pending (server wins across all three)', () => {
    const rx = rxRunningOut(-3);
    const context = { now: NOW, requests: [openRequest('rx-test')], failedAttempts: [failed('rx-test')] };
    expect(getRxStatus(rx, context)).toBe('pending');
    expect(canRefill(rx, context)).toBe(false);
  });

  it('demo path ?simulate=duplicate: Levothyroxine confirm -> duplicate message; row Pending, Refill disabled, and it stays that way', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    window.history.replaceState({}, '', '/?simulate=duplicate');
    const clock = createTestClock(NOW);
    render(<App clock={clock} initialRoute="pharmacy" />);
    expect(badge('Levothyroxine').getByText(NOT_SENT)).toBeTruthy(); // device doesn't know yet

    fireEvent.click(refillButton('Levothyroxine'));
    fireEvent.click(confirmButton());
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByRole('alert').textContent).toContain('You already requested this refill');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(badge('Levothyroxine').getByText('Pending')).toBeTruthy();
    expect(badge('Levothyroxine').queryByText(NOT_SENT)).toBeNull();
    expect(refillButton('Levothyroxine').disabled).toBe(true);

    // Navigating away and back, and time passing within the old 24h window, don't bring Not sent back.
    clock.advance(HOUR_MS);
    goToPharmacy();
    expect(badge('Levothyroxine').getByText('Pending')).toBeTruthy();
    expect(refillButton('Levothyroxine').disabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
describe('Case 8: the 24h clock runs from the first failure', () => {
  it('fail at T, fail at T+8h -> Not sent at T+24h-1s, cleared at T+24h (not T+32h)', async () => {
    const { clock } = setup({ connectionFailures: 2 });
    await failOnce('Atorvastatin'); // T
    clock.advance(8 * HOUR_MS);
    await failOnce('Atorvastatin'); // T+8h
    expect(badge('Atorvastatin').getByText(NOT_SENT)).toBeTruthy();

    clock.advance(16 * HOUR_MS - 1000); // T+24h-1s
    goToPharmacy();
    expect(badge('Atorvastatin').getByText(NOT_SENT)).toBeTruthy();

    clock.advance(1000); // T+24h
    goToPharmacy();
    expect(badge('Atorvastatin').queryByText(NOT_SENT)).toBeNull();
    expect(badge('Atorvastatin').getByText('Refill Available')).toBeTruthy();
  });

  it('seeded Levothyroxine (first failure 2h ago) failing again now still clears at NOW+22h', async () => {
    const { clock } = setup({ connectionFailures: 1 });
    await failOnce('Levothyroxine');
    clock.advance(22 * HOUR_MS - 1000);
    goToPharmacy();
    expect(badge('Levothyroxine').getByText(NOT_SENT)).toBeTruthy();
    clock.advance(1000);
    goToPharmacy();
    expect(badge('Levothyroxine').queryByText(NOT_SENT)).toBeNull();
  });

  it('a failure after the window expired starts a new window from that failure', () => {
    const T = NOW;
    const first = recordFailedAttempt(null, { prescriptionId: 'rx-test', requestId: 'r', failure: 'not_sent', attempts: 1, now: T });
    const later = new Date(T.getTime() + 25 * HOUR_MS);
    const second = recordFailedAttempt(first, { prescriptionId: 'rx-test', requestId: 'r', failure: 'not_sent', attempts: 2, now: later });
    expect(second.firstFailedAt).toBe(later.toISOString());
  });
});

// ---------------------------------------------------------------------------
describe('Case 9: a successful retry still clears Not sent immediately', () => {
  it('fail twice, then succeed: Pending immediately, no clock change', async () => {
    const { clock } = setup({ connectionFailures: 2 });
    const before = clock.now().getTime();
    fireEvent.click(refillButton('Atorvastatin'));
    fireEvent.click(confirmButton());
    await settle();
    fireEvent.click(confirmButton());
    await settle();
    fireEvent.click(confirmButton());
    await settle();
    expect(screen.getByRole('heading', { name: 'Order confirmed' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(clock.now().getTime()).toBe(before);
    expect(badge('Atorvastatin').queryByText(NOT_SENT)).toBeNull();
    expect(badge('Atorvastatin').getByText('Pending')).toBeTruthy();
  });

  it('overdue Amlodipine: fail, then succeed -> Pending immediately', async () => {
    setup({ connectionFailures: 1 });
    await failOnce('Amlodipine');
    fireEvent.click(refillButton('Amlodipine'));
    fireEvent.click(confirmButton());
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(badge('Amlodipine').queryByText(NOT_SENT)).toBeNull();
    expect(badge('Amlodipine').getByText('Pending')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
describe('Case 10: expiry returns the correct underlying status', () => {
  it('overdue Amlodipine: Not sent -> 24h later -> Needs a refill', async () => {
    const { clock } = setup({ connectionFailures: 1 });
    await failOnce('Amlodipine');
    expect(badge('Amlodipine').getByText(NOT_SENT)).toBeTruthy();
    clock.advance(DAY_MS);
    goToPharmacy();
    expect(badge('Amlodipine').getByText('Needs a refill')).toBeTruthy();
    expect(refillButton('Amlodipine').disabled).toBe(false);
  });

  it('Levothyroxine within 7 days: seeded Not sent -> expiry -> Low', () => {
    const { clock } = setup();
    clock.advance(22 * HOUR_MS);
    goToPharmacy();
    expect(badge('Levothyroxine').getByText('Low')).toBeTruthy();
    expect(badge('Levothyroxine').queryByText(NOT_SENT)).toBeNull();
  });

  it('a medication that runs out during the Not sent window expires to Needs a refill, not Low', () => {
    const rx = rxRunningOut(1); // Low at failure time
    expect(getRxStatus(rx, { now: NOW, failedAttempts: [failed('rx-test')] })).toBe('not_sent');
    const after = new Date(NOW.getTime() + DAY_MS);
    expect(getRxStatus(rx, { now: after, failedAttempts: [failed('rx-test')] })).toBe('needs_refill');
  });
});

// ---------------------------------------------------------------------------
describe('Case 12: keyboard (structural, jsdom)', () => {
  const focusableNames = () =>
    [...document.querySelectorAll('button, select, input, a[href], textarea, [tabindex]')]
      .filter((el) => !el.disabled && el.getAttribute('tabindex') !== '-1')
      .map((el) => el.getAttribute('aria-label') ?? el.textContent.trim());

  it('Needs a refill row: status is plain text (not a focus stop); its Refill is focusable and opens the refill screen', () => {
    setup();
    for (const el of document.querySelectorAll('[tabindex]')) {
      expect(Number(el.getAttribute('tabindex'))).toBeLessThanOrEqual(0);
    }
    const status = badge('Amlodipine').getByText('Needs a refill');
    expect(status.tagName).toBe('SPAN');
    expect(status.hasAttribute('tabindex')).toBe(false);
    expect(focusableNames()).toContain('Refill Amlodipine');
    const button = refillButton('Amlodipine');
    button.focus();
    expect(document.activeElement).toBe(button);
    fireEvent.click(button);
    expect(screen.getByRole('heading', { name: 'Confirm refill' })).toBeTruthy();
  });

  it('server-wins row: disabled Refill is out of the tab order and cannot take focus; other Refills stay reachable', () => {
    const seed = createSeedData(NOW);
    renderList(seed.prescriptions, {
      now: NOW,
      requests: [...seed.refillRequests, openRequest('rx-levothyroxine')],
      failedAttempts: seed.failedAttempts,
    });
    const names = focusableNames();
    expect(names).not.toContain('Refill Levothyroxine');
    expect(names).toEqual(expect.arrayContaining(['Refill Atorvastatin', 'Refill Lisinopril', 'Refill Amlodipine']));
    const disabled = refillButton('Levothyroxine');
    disabled.focus();
    expect(document.activeElement).not.toBe(disabled);
  });
});
