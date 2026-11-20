// QA tests for the Anthem exception paths (Branch A: already pending,
// Branch B: submission failed). Written by dev-qa against commit b7d0c0d.
// Case numbers match BRIEF 3. These drive the public journey (App with an
// injected test clock and simulated server) wherever practical.

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { DAY_MS, HOUR_MS, createTestClock } from '../src/data/clock';
import { canRefill, createSeedData, getRxStatus, isLow, REQUEST_END_STATES } from '../src/data/mockData';
import { createRefillServer } from '../src/data/refillServer';
import PharmacyScreen from '../src/screens/PharmacyScreen';
import { pharmacyPlan } from '../src/data/mockData';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const NOW = new Date(2026, 10, 18, 10, 0, 0);
const HELP = 'Still not working?';

// Wraps submitRefill so every call's arguments are recorded.
function spyServer(server) {
  const calls = [];
  const original = server.submitRefill;
  server.submitRefill = (args) => {
    calls.push({ ...args });
    return original(args);
  };
  return calls;
}

function setup({ simulation = {}, server: makeServer } = {}) {
  const clock = createTestClock(NOW);
  const seed = createSeedData(NOW);
  const server = makeServer
    ? makeServer({ clock, seed })
    : createRefillServer({ clock, requests: seed.refillRequests, latencyMs: 0, simulation });
  const calls = spyServer(server);
  render(<App clock={clock} server={server} initialRoute="pharmacy" />);
  return { clock, server, calls };
}

const row = (name) => screen.getByRole('heading', { name }).closest('article');
const refillButton = (name) => within(row(name)).getByRole('button', { name: `Refill ${name}` });
const confirmButton = () => screen.getByRole('button', { name: 'Confirm refill' });
const settle = () => act(async () => {});
const goToPharmacy = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Home' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pharmacy' }));
};
const requestsFor = (server, id) => server.getRequests().filter((req) => req.prescriptionId === id);

// ---------------------------------------------------------------------------
describe('Case 1: double tap on Confirm refill', () => {
  it('two taps in the same frame (before React re-renders) create exactly one request', async () => {
    let release;
    const { server, calls } = setup({
      server: ({ clock, seed }) => {
        const s = createRefillServer({ clock, requests: seed.refillRequests, latencyMs: 0 });
        const original = s.submitRefill;
        s.submitRefill = (args) => new Promise((resolve) => (release = () => resolve(original(args))));
        return s;
      },
    });
    fireEvent.click(refillButton('Atorvastatin'));
    const button = confirmButton();
    act(() => {
      button.click();
      button.click();
    });
    expect(screen.getByRole('status').textContent).toContain('Sending your refill');
    await act(async () => release());
    expect(screen.getByRole('heading', { name: 'Order confirmed' })).toBeTruthy();
    expect(calls).toHaveLength(1);
    expect(requestsFor(server, 'rx-atorvastatin')).toHaveLength(1);
  });

  it('two separate taps (a re-render between them) create exactly one request', async () => {
    const { server, calls } = setup();
    fireEvent.click(refillButton('Atorvastatin'));
    const button = confirmButton();
    fireEvent.click(button);
    fireEvent.click(button);
    await settle();
    expect(calls).toHaveLength(1);
    expect(requestsFor(server, 'rx-atorvastatin')).toHaveLength(1);
  });

  it('double tap on the retry after a failure sends one more submission, not two', async () => {
    const { calls } = setup({ simulation: { connectionFailures: 1 } });
    fireEvent.click(refillButton('Atorvastatin'));
    fireEvent.click(confirmButton());
    await settle();
    const button = confirmButton();
    act(() => {
      button.click();
      button.click();
    });
    await settle();
    expect(calls).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
describe('Case 2: retry after failure reuses the request ID', () => {
  it('connection failure -> retry sends the same ID; one request on success', async () => {
    const { server, calls } = setup({ simulation: { connectionFailures: 1 } });
    fireEvent.click(refillButton('Atorvastatin'));
    fireEvent.click(confirmButton());
    await settle();
    fireEvent.click(confirmButton());
    await settle();
    expect(screen.getByRole('heading', { name: 'Order confirmed' })).toBeTruthy();
    expect(calls).toHaveLength(2);
    expect(calls[0].requestId).toBeTruthy();
    expect(calls[1].requestId).toBe(calls[0].requestId);
    const stored = requestsFor(server, 'rx-atorvastatin');
    expect(stored).toHaveLength(1);
    expect(stored[0].requestId).toBe(calls[0].requestId);
  });

  it('leaving after a failure and retrying from the Not sent row still reuses the ID', async () => {
    const { server, calls } = setup({ simulation: { connectionFailures: 1 } });
    fireEvent.click(refillButton('Atorvastatin'));
    fireEvent.click(confirmButton());
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    goToPharmacy();
    fireEvent.click(refillButton('Atorvastatin'));
    fireEvent.click(confirmButton());
    await settle();
    expect(calls[1].requestId).toBe(calls[0].requestId);
    expect(requestsFor(server, 'rx-atorvastatin')).toHaveLength(1);
  });

  it('pharmacy unreachable -> change pharmacy -> retry keeps the ID; one request', async () => {
    const { server, calls } = setup({ simulation: { unreachablePharmacyIds: ['cvs'] } });
    fireEvent.click(refillButton('Atorvastatin'));
    fireEvent.click(confirmButton());
    await settle();
    fireEvent.change(screen.getByLabelText('Pharmacy'), { target: { value: 'walgreens' } });
    fireEvent.click(confirmButton());
    await settle();
    expect(calls[1].requestId).toBe(calls[0].requestId);
    expect(calls[1].pharmacy.id).toBe('walgreens');
    expect(requestsFor(server, 'rx-atorvastatin')).toHaveLength(1);
  });

  it('retry of the seeded Not sent medication reuses its recorded ID', async () => {
    const { calls } = setup();
    fireEvent.click(refillButton('Levothyroxine'));
    // seed failure was CVS unreachable; no simulation now, so the retry succeeds
    fireEvent.click(confirmButton());
    await settle();
    expect(calls[0].requestId).toBe('req-seed-levothyroxine');
  });

  it('robustness: if a request was stored but the device saw a failure, the retry returns that request, not a second', async () => {
    const { server, calls } = setup({
      server: ({ clock, seed }) => {
        const s = createRefillServer({ clock, requests: seed.refillRequests, latencyMs: 0 });
        const original = s.submitRefill;
        let first = true;
        s.submitRefill = async (args) => {
          const result = await original(args);
          if (first) {
            first = false;
            return { status: 'failed', failure: 'not_sent', requestId: args.requestId };
          }
          return result;
        };
        return s;
      },
    });
    fireEvent.click(refillButton('Atorvastatin'));
    fireEvent.click(confirmButton());
    await settle();
    fireEvent.click(confirmButton());
    await settle();
    expect(screen.getByRole('heading', { name: 'Order confirmed' })).toBeTruthy();
    expect(calls[1].requestId).toBe(calls[0].requestId);
    expect(requestsFor(server, 'rx-atorvastatin')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
describe('Case 3: duplicate from a second source', () => {
  it('the disabled Refill on a Pending row cannot open the refill screen', () => {
    setup();
    const button = refillButton('Metformin');
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(screen.queryByRole('button', { name: 'Confirm refill' })).toBeNull();
  });

  it('server: a new request ID for a prescription with an open request is rejected', async () => {
    const clock = createTestClock(NOW);
    const seed = createSeedData(NOW);
    const server = createRefillServer({ clock, requests: seed.refillRequests, latencyMs: 0 });
    const response = await server.submitRefill({
      requestId: 'req-second-source',
      prescriptionId: 'rx-metformin',
      pharmacy: { id: 'walgreens', name: 'Walgreens' },
      delivery: 'home',
    });
    expect(response.status).toBe('duplicate');
    expect(response.request.requestId).toBe('req-seed-metformin');
    expect(requestsFor(server, 'rx-metformin')).toHaveLength(1);
  });

  it('UI: a request made on another device -> "You already requested this refill" + existing status; no second request', async () => {
    const { server } = setup();
    server.seedRequest({
      requestId: 'req-other-device',
      prescriptionId: 'rx-atorvastatin',
      status: 'processing',
      submittedAt: new Date(NOW.getTime() - HOUR_MS).toISOString(),
      expectedUpdate: '2026-11-19',
      pharmacyId: 'walgreens',
      delivery: 'pickup',
    });
    fireEvent.click(refillButton('Atorvastatin'));
    fireEvent.click(confirmButton());
    await settle();
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('You already requested this refill');
    expect(alert.textContent).toContain('Status: Pending. Requested Nov 18, 2026. Expected update Nov 19, 2026.');
    expect(confirmButton().disabled).toBe(true);
    expect(requestsFor(server, 'rx-atorvastatin')).toHaveLength(1);
    expect(requestsFor(server, 'rx-atorvastatin')[0].requestId).toBe('req-other-device');

    // Back in the list, the row now reflects the existing request.
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(within(row('Atorvastatin')).getByText('Pending')).toBeTruthy();
    expect(refillButton('Atorvastatin').disabled).toBe(true);
  });

  // Round 2, Change 2 (server wins): updated by dev-developer. Round 1 recorded
  // that the row kept showing "Not sent" with Refill enabled; the rule now says
  // the known open server request wins: Pending, Refill disabled.
  it('server wins: duplicate on a Not sent medication turns the row Pending with Refill disabled', async () => {
    const { server } = setup();
    server.seedRequest({
      requestId: 'req-other-device-levo',
      prescriptionId: 'rx-levothyroxine',
      status: 'submitted',
      submittedAt: NOW.toISOString(),
      expectedUpdate: '2026-11-19',
    });
    fireEvent.click(refillButton('Levothyroxine'));
    fireEvent.click(confirmButton());
    await settle();
    expect(screen.getByRole('alert').textContent).toContain('You already requested this refill');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    const levo = row('Levothyroxine');
    expect(within(levo).queryByText('Not sent. Try again')).toBeNull();
    expect(within(levo).getByText('Pending')).toBeTruthy();
    expect(levo.textContent).toMatch(/Refill requested Nov 18, 2026\. Expected update Nov 19, 2026\./);
    expect(refillButton('Levothyroxine').disabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
describe('Case 4: 24-hour expiry of Not sent', () => {
  it('clears at exactly 24h after the failure (navigating back to the list)', async () => {
    const { clock } = setup({ simulation: { connectionFailures: 1 } });
    fireEvent.click(refillButton('Atorvastatin'));
    fireEvent.click(confirmButton());
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(within(row('Atorvastatin')).getByText('Not sent. Try again')).toBeTruthy();

    clock.advance(DAY_MS - 1000);
    goToPharmacy();
    expect(within(row('Atorvastatin')).getByText('Not sent. Try again')).toBeTruthy();

    clock.advance(1000);
    goToPharmacy();
    expect(within(row('Atorvastatin')).queryByText('Not sent. Try again')).toBeNull();
    expect(within(row('Atorvastatin')).getByText('Refill Available')).toBeTruthy();
    expect(refillButton('Atorvastatin').disabled).toBe(false);
  });

  it('clears on a list left open (once-a-minute refresh), with no navigation', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const { clock } = setup();
    // Seeded Levothyroxine failed 2h before NOW; expires at NOW + 22h.
    expect(within(row('Levothyroxine')).getByText('Not sent. Try again')).toBeTruthy();
    clock.advance(22 * HOUR_MS);
    act(() => vi.advanceTimersByTime(60 * 1000));
    expect(within(row('Levothyroxine')).queryByText('Not sent. Try again')).toBeNull();
    // Its normal status: Levothyroxine is within 7 days of run-out -> Low.
    expect(within(row('Levothyroxine')).getByText('Low')).toBeTruthy();
    expect(refillButton('Levothyroxine').disabled).toBe(false);
  });

  it('OBSERVATION: after expiry, reopening starts a fresh request (new ID, attempt count reset)', async () => {
    const { clock, calls } = setup({ simulation: { connectionFailures: 1 } });
    clock.advance(22 * HOUR_MS);
    goToPharmacy();
    fireEvent.click(refillButton('Levothyroxine'));
    fireEvent.click(confirmButton());
    await settle();
    expect(calls[0].requestId).not.toBe('req-seed-levothyroxine');
    // one failure after expiry -> treated as a first failure: no help text
    expect(screen.getByRole('alert').textContent).not.toContain(HELP);
  });
});

// ---------------------------------------------------------------------------
describe('Case 5: Not sent clears immediately on a successful retry', () => {
  it('fail, retry successfully, list shows Pending (not Not sent) with no clock change', async () => {
    const { clock } = setup({ simulation: { connectionFailures: 1 } });
    const before = clock.now().getTime();
    fireEvent.click(refillButton('Atorvastatin'));
    fireEvent.click(confirmButton());
    await settle();
    fireEvent.click(confirmButton());
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(clock.now().getTime()).toBe(before);
    expect(within(row('Atorvastatin')).queryByText('Not sent. Try again')).toBeNull();
    expect(within(row('Atorvastatin')).getByText('Pending')).toBeTruthy();
  });

  it('seeded Not sent medication: successful retry clears Not sent immediately', async () => {
    setup();
    fireEvent.click(refillButton('Levothyroxine'));
    fireEvent.click(confirmButton());
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(within(row('Levothyroxine')).queryByText('Not sent. Try again')).toBeNull();
    expect(within(row('Levothyroxine')).getByText('Pending')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
describe('Case 6: status priority collisions', () => {
  it('Low + Pending shows Pending; Low + Not sent shows Not sent (list, text)', () => {
    const seed = createSeedData(NOW);
    const metformin = seed.prescriptions.find((rx) => rx.id === 'rx-metformin');
    const levo = seed.prescriptions.find((rx) => rx.id === 'rx-levothyroxine');
    // Precondition: both are genuinely Low.
    expect(isLow(metformin, NOW)).toBe(true);
    expect(isLow(levo, NOW)).toBe(true);

    setup();
    const m = row('Metformin');
    expect(within(m).getByText('Pending')).toBeTruthy();
    expect(within(m).queryByText('Low')).toBeNull();
    const l = row('Levothyroxine');
    expect(within(l).getByText('Not sent. Try again')).toBeTruthy();
    expect(within(l).queryByText('Low')).toBeNull();
  });

  // Round 2, Change 2 (server wins): updated by dev-developer. Round 1 expected
  // 'not_sent'; a known open server request now overrides the local record.
  it('Low + Pending (known open server request) + Not sent together shows Pending', () => {
    const seed = createSeedData(NOW);
    const metformin = seed.prescriptions.find((rx) => rx.id === 'rx-metformin');
    const status = getRxStatus(metformin, {
      now: NOW,
      requests: seed.refillRequests,
      failedAttempts: [{ prescriptionId: 'rx-metformin', failedAt: NOW.toISOString(), attempts: 1 }],
    });
    expect(status).toBe('pending');
  });
});

// ---------------------------------------------------------------------------
describe('Case 7: entries preserved after a failure', () => {
  it('connection failure keeps medication, pharmacy (Walgreens) and Home delivery', async () => {
    setup({ simulation: { connectionFailures: 1 } });
    fireEvent.click(refillButton('Atorvastatin'));
    fireEvent.change(screen.getByLabelText('Pharmacy'), { target: { value: 'walgreens' } });
    fireEvent.click(screen.getByLabelText(/Home delivery/));
    fireEvent.click(confirmButton());
    await settle();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Atorvastatin' })).toBeTruthy();
    expect(screen.getByLabelText('Pharmacy').value).toBe('walgreens');
    expect(screen.getByLabelText(/Home delivery/).checked).toBe(true);
    expect(screen.getByLabelText(/Pharmacy pickup/).checked).toBe(false);
  });

  it('pharmacy failure keeps CVS + Home delivery', async () => {
    setup({ simulation: { unreachablePharmacyIds: ['cvs'] } });
    fireEvent.click(refillButton('Lisinopril'));
    fireEvent.click(screen.getByLabelText(/Home delivery/));
    fireEvent.click(confirmButton());
    await settle();
    expect(screen.getByRole('heading', { name: 'Lisinopril' })).toBeTruthy();
    expect(screen.getByLabelText('Pharmacy').value).toBe('cvs');
    expect(screen.getByLabelText(/Home delivery/).checked).toBe(true);
  });

  it('entries are still set after leaving and returning to the Not sent medication', async () => {
    setup({ simulation: { connectionFailures: 1 } });
    fireEvent.click(refillButton('Atorvastatin'));
    fireEvent.change(screen.getByLabelText('Pharmacy'), { target: { value: 'walgreens' } });
    fireEvent.click(screen.getByLabelText(/Home delivery/));
    fireEvent.click(confirmButton());
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    goToPharmacy();
    fireEvent.click(refillButton('Atorvastatin'));
    expect(screen.getByLabelText('Pharmacy').value).toBe('walgreens');
    expect(screen.getByLabelText(/Home delivery/).checked).toBe(true);
  });
});

// ---------------------------------------------------------------------------
describe('Case 8: help text timing', () => {
  it('connection failure: none after the first failure, shown after the second', async () => {
    setup({ simulation: { connectionFailures: 2 } });
    fireEvent.click(refillButton('Atorvastatin'));
    fireEvent.click(confirmButton());
    await settle();
    expect(screen.getByRole('alert').textContent).not.toContain(HELP);
    fireEvent.click(confirmButton());
    await settle();
    expect(screen.getByRole('alert').textContent).toContain(
      'Still not working? Call 1-800-555-0100 and tell them the medication and the time you tried.',
    );
  });

  it('pharmacy failure: none after the first failure, shown after the second', async () => {
    setup({ simulation: { unreachablePharmacyIds: ['cvs'] } });
    fireEvent.click(refillButton('Atorvastatin'));
    fireEvent.click(confirmButton());
    await settle();
    expect(screen.getByRole('alert').textContent).not.toContain(HELP);
    fireEvent.click(confirmButton());
    await settle();
    expect(screen.getByRole('alert').textContent).toContain(HELP);
  });

  it('the count carries across leaving and returning (second failure overall shows it)', async () => {
    setup({ simulation: { connectionFailures: 2 } });
    fireEvent.click(refillButton('Atorvastatin'));
    fireEvent.click(confirmButton());
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(refillButton('Atorvastatin'));
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(confirmButton());
    await settle();
    expect(screen.getByRole('alert').textContent).toContain(HELP);
  });
});

// ---------------------------------------------------------------------------
describe('Case 9: end states make the medication refillable again', () => {
  const seed = createSeedData(NOW);
  const metformin = seed.prescriptions.find((rx) => rx.id === 'rx-metformin');

  it('the end states are exactly delivered, ready for pickup, cancelled, failed', () => {
    expect([...REQUEST_END_STATES].sort()).toEqual(['cancelled', 'delivered', 'failed', 'ready_for_pickup']);
  });

  for (const endState of ['delivered', 'ready_for_pickup', 'cancelled', 'failed']) {
    it(`${endState}: row is not Pending, Refill is enabled, and the server accepts a new request`, async () => {
      const requests = seed.refillRequests.map((req) =>
        req.prescriptionId === 'rx-metformin' ? { ...req, status: endState } : req,
      );
      const context = { now: NOW, requests, failedAttempts: seed.failedAttempts };
      expect(getRxStatus(metformin, context)).not.toBe('pending');
      expect(canRefill(metformin, context)).toBe(true);

      const onRefill = vi.fn();
      render(
        <PharmacyScreen
          plan={pharmacyPlan}
          prescriptions={seed.prescriptions}
          statusContext={context}
          onRefill={onRefill}
        />,
      );
      const button = refillButton('Metformin');
      expect(button.textContent).toBe('Refill');
      expect(button.disabled).toBe(false);
      expect(within(row('Metformin')).queryByText('Pending')).toBeNull();
      fireEvent.click(button);
      expect(onRefill).toHaveBeenCalledTimes(1);

      const server = createRefillServer({ clock: createTestClock(NOW), requests, latencyMs: 0 });
      const response = await server.submitRefill({
        requestId: `req-after-${endState}`,
        prescriptionId: 'rx-metformin',
        pharmacy: { id: 'cvs', name: 'CVS Pharmacy' },
        delivery: 'pickup',
      });
      expect(response.status).toBe('created');
    });
  }

  it('an open (non-end) status keeps Refill disabled', () => {
    for (const status of ['submitted', 'processing']) {
      const requests = seed.refillRequests.map((req) => ({ ...req, status }));
      expect(canRefill(metformin, { now: NOW, requests, failedAttempts: [] })).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
describe('Case 10: keyboard operation (structural checks; real-browser pass recorded separately)', () => {
  const focusable = (root) =>
    [...root.querySelectorAll('button, select, input, a[href], textarea, [tabindex]')].filter(
      (el) => !el.disabled && el.getAttribute('tabindex') !== '-1',
    );

  it('prescription list: every control is a native focusable element, no positive tabindex', () => {
    setup();
    for (const el of document.querySelectorAll('[tabindex]')) {
      expect(Number(el.getAttribute('tabindex'))).toBeLessThanOrEqual(0);
    }
    const names = focusable(document.body).map((el) => el.getAttribute('aria-label') ?? el.textContent.trim());
    expect(names).toEqual(
      expect.arrayContaining(['Refill Atorvastatin', 'Refill Lisinopril', 'Refill Levothyroxine', 'Pharmacy']),
    );
    // Disabled Refill (Pending) is skipped by Tab and cannot take focus.
    expect(names).not.toContain('Refill Metformin');
    const disabled = refillButton('Metformin');
    disabled.focus();
    expect(document.activeElement).not.toBe(disabled);
  });

  it('refill screen: controls are focusable; Change pharmacy moves focus to the pharmacy picker', async () => {
    setup({ simulation: { unreachablePharmacyIds: ['cvs'] } });
    fireEvent.click(refillButton('Atorvastatin'));
    fireEvent.click(confirmButton());
    await settle();
    const tags = focusable(document.body).map((el) => el.tagName);
    expect(tags).toEqual(expect.arrayContaining(['BUTTON', 'SELECT', 'INPUT']));
    fireEvent.click(screen.getByRole('button', { name: 'Change pharmacy' }));
    expect(document.activeElement).toBe(screen.getByLabelText('Pharmacy'));
  });

  it('duplicate state: Confirm refill is disabled and out of the tab order; Back and Cancel stay reachable', async () => {
    const { server } = setup();
    server.seedRequest({
      requestId: 'req-other',
      prescriptionId: 'rx-atorvastatin',
      status: 'submitted',
      submittedAt: NOW.toISOString(),
      expectedUpdate: '2026-11-19',
    });
    fireEvent.click(refillButton('Atorvastatin'));
    fireEvent.click(confirmButton());
    await settle();
    const names = focusable(document.body).map((el) => el.getAttribute('aria-label') ?? el.textContent.trim());
    expect(names).not.toContain('Confirm refill');
    expect(names).toEqual(expect.arrayContaining(['Back', 'Cancel']));
  });
});
