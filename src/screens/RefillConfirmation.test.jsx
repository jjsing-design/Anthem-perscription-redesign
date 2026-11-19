import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { createSeedData } from '../data/mockData';
import RefillConfirmation from './RefillConfirmation';

afterEach(cleanup);

it('disables Confirm refill on the first tap, so a second tap sends nothing', () => {
  const rx = createSeedData(new Date(2026, 10, 18)).prescriptions[0];
  const onConfirm = vi.fn();
  render(
    <RefillConfirmation
      prescription={rx}
      draft={{ pharmacyId: 'cvs', delivery: 'pickup', attempts: 0, error: null, requestId: null }}
      supportPhone="1-800-555-0100"
      onDraftChange={() => {}}
      onCancel={() => {}}
      onConfirm={onConfirm}
    />,
  );
  const button = screen.getByRole('button', { name: 'Confirm refill' });
  fireEvent.click(button);
  expect(button.disabled).toBe(true);
  fireEvent.click(button);
  expect(onConfirm).toHaveBeenCalledTimes(1);
});
