import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';
import { DAY_MS, createTestClock } from './data/clock';
import { createSeedData } from './data/mockData';
import { createRefillServer } from './data/refillServer';

afterEach(cleanup);

const NOW = new Date(2026, 10, 18, 10, 0, 0);

function setup(simulation = {}) {
  const clock = createTestClock(NOW);
  const seed = createSeedData(NOW);
  const server = createRefillServer({ clock, requests: seed.refillRequests, latencyMs: 0, simulation });
  render(<App clock={clock} server={server} initialRoute="pharmacy" />);
  return { clock, server };
}

function row(name) {
  return screen.getByRole('heading', { name }).closest('article');
}

async function settle() {
  await act(async () => {});
}

describe('prescription list', () => {
  it('shows Not sent, Pending, Low and normal as text', () => {
    setup();
    expect(within(row('Levothyroxine')).getByText('Not sent. Try again')).toBeTruthy();
    expect(within(row('Metformin')).getByText('Pending')).toBeTruthy();
    expect(within(row('Lisinopril')).getByText('Low')).toBeTruthy();
    expect(within(row('Atorvastatin')).getByText('Refill Available')).toBeTruthy();
  });

  it('Branch A: pending row keeps a disabled "Refill" button and states request date + expected update', () => {
    setup();
    const metformin = row('Metformin');
    const button = within(metformin).getByRole('button', { name: 'Refill Metformin' });
    expect(button.textContent).toBe('Refill');
    expect(button.disabled).toBe(true);
    expect(metformin.textContent).toMatch(/Refill requested Nov 17, 2026\. Expected update Nov 19, 2026\./);
  });

  it('Not sent row keeps Refill enabled', () => {
    setup();
    expect(within(row('Levothyroxine')).getByRole('button', { name: 'Refill Levothyroxine' }).disabled).toBe(false);
  });
});

describe('Branch B: known failures', () => {
  it('pharmacy unreachable: message, Change pharmacy, entries kept, help text on second failure, same request ID', async () => {
    const { server } = setup({ unreachablePharmacyIds: ['cvs'] });
    fireEvent.click(within(row('Atorvastatin')).getByRole('button', { name: 'Refill Atorvastatin' }));
    fireEvent.click(screen.getByLabelText(/Home delivery/));

    const confirm = screen.getByRole('button', { name: 'Confirm refill' });
    fireEvent.click(confirm);
    await settle();

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain(
      "We couldn't reach CVS Pharmacy. Your request wasn't sent. You can try again or choose a different pharmacy.",
    );
    expect(within(alert).getByRole('button', { name: 'Change pharmacy' })).toBeTruthy();
    expect(alert.textContent).not.toContain('Still not working?');
    expect(screen.getByLabelText('Pharmacy').value).toBe('cvs');
    expect(screen.getByLabelText(/Home delivery/).checked).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Confirm refill' }));
    await settle();
    expect(screen.getByRole('alert').textContent).toContain(
      'Still not working? Call 1-800-555-0100 and tell them the medication and the time you tried.',
    );

    const ids = server.getLog().map((entry) => entry.requestId);
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe(ids[1]);
  });

  it('connection failure: message without Change pharmacy; leaving shows Not sent; retry success clears it', async () => {
    const { server } = setup({ connectionFailures: 1 });
    fireEvent.click(within(row('Atorvastatin')).getByRole('button', { name: 'Refill Atorvastatin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm refill' }));
    await settle();

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain("Your request wasn't sent. Check your connection and try again.");
    expect(within(alert).queryByRole('button', { name: 'Change pharmacy' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(within(row('Atorvastatin')).getByText('Not sent. Try again')).toBeTruthy();

    fireEvent.click(within(row('Atorvastatin')).getByRole('button', { name: 'Refill Atorvastatin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm refill' }));
    await settle();
    expect(screen.getByRole('heading', { name: 'Order confirmed' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(within(row('Atorvastatin')).getByText('Pending')).toBeTruthy();
    expect(server.getRequests().filter((req) => req.prescriptionId === 'rx-atorvastatin')).toHaveLength(1);
  });

  it('Not sent clears 24 hours after the failed attempt', async () => {
    const { clock } = setup({ connectionFailures: 1 });
    fireEvent.click(within(row('Atorvastatin')).getByRole('button', { name: 'Refill Atorvastatin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm refill' }));
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(within(row('Atorvastatin')).getByText('Not sent. Try again')).toBeTruthy();

    clock.advance(DAY_MS - 1);
    fireEvent.click(screen.getByRole('button', { name: /^Home/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /Pharmacy/ })[0]);
    expect(within(row('Atorvastatin')).getByText('Not sent. Try again')).toBeTruthy();

    clock.advance(1);
    fireEvent.click(screen.getByRole('button', { name: /^Home/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /Pharmacy/ })[0]);
    expect(within(row('Atorvastatin')).getByText('Refill Available')).toBeTruthy();
  });
});

describe('Branch A: duplicate reaches the server', () => {
  it('shows "You already requested this refill" with the existing status', async () => {
    const { server } = setup();
    server.seedRequest({
      requestId: 'other-device',
      prescriptionId: 'rx-atorvastatin',
      status: 'submitted',
      submittedAt: NOW.toISOString(),
      expectedUpdate: '2026-11-19',
    });
    fireEvent.click(within(row('Atorvastatin')).getByRole('button', { name: 'Refill Atorvastatin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm refill' }));
    await settle();

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('You already requested this refill');
    expect(alert.textContent).toContain('Status: Pending. Requested Nov 18, 2026. Expected update Nov 19, 2026.');
    expect(screen.getByRole('button', { name: 'Confirm refill' }).disabled).toBe(true);
    expect(server.getRequests().filter((req) => req.prescriptionId === 'rx-atorvastatin')).toHaveLength(1);
  });
});

describe('confirm button', () => {
  it('is disabled immediately on tap and a loading state shows', async () => {
    const clock = createTestClock(NOW);
    const seed = createSeedData(NOW);
    let release;
    const server = createRefillServer({ clock, requests: seed.refillRequests, latencyMs: 0 });
    const original = server.submitRefill;
    server.submitRefill = (args) => new Promise((resolve) => (release = () => resolve(original(args))));
    render(<App clock={clock} server={server} initialRoute="pharmacy" />);

    fireEvent.click(within(row('Atorvastatin')).getByRole('button', { name: 'Refill Atorvastatin' }));
    const confirm = screen.getByRole('button', { name: 'Confirm refill' });
    fireEvent.click(confirm);
    expect(screen.getByRole('status').textContent).toContain('Sending your refill');
    await act(async () => release());
    expect(screen.getByRole('heading', { name: 'Order confirmed' })).toBeTruthy();
  });
});
