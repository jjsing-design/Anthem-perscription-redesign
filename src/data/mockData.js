export const user = {
  firstName: 'Jordan',
  lastName: 'Ellis',
  memberId: 'XAH8846210',
  planName: 'Anthem Blue Access PPO',
};

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

export const prescriptions = [
  {
    id: 'rx-atorvastatin',
    name: 'Atorvastatin',
    dosage: '20 mg',
    form: 'Tablet',
    quantity: 30,
    daysSupply: 30,
    prescriber: 'Dr. Priya Shah',
    lastRefilled: '2026-08-18',
    nextRefillDate: '2026-09-17',
    medicationCost: 62.4,
    planPays: 49.9,
    fulfillment: null,
  },
  {
    id: 'rx-lisinopril',
    name: 'Lisinopril',
    dosage: '10 mg',
    form: 'Tablet',
    quantity: 30,
    daysSupply: 30,
    prescriber: 'Dr. Priya Shah',
    lastRefilled: '2026-09-18',
    nextRefillDate: '2026-10-18',
    medicationCost: 36,
    planPays: 28,
    fulfillment: null,
  },
  {
    id: 'rx-metformin',
    name: 'Metformin',
    dosage: '500 mg',
    form: 'Tablet',
    quantity: 60,
    daysSupply: 30,
    prescriber: 'Dr. Priya Shah',
    lastRefilled: '2026-09-01',
    nextRefillDate: '2026-10-01',
    medicationCost: 18.25,
    planPays: 14,
    fulfillment: 'pending',
  },
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

export function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function getRxStatus(rx, today = new Date()) {
  if (rx.fulfillment === 'pending') return 'pending';
  const due = startOfDay(new Date(`${rx.nextRefillDate}T00:00:00`));
  return due <= startOfDay(today) ? 'refill_available' : 'active';
}

export function canRefill(rx, today = new Date()) {
  return getRxStatus(rx, today) === 'refill_available';
}

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

export function formatDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
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

export function refillHelper(rx, today = new Date()) {
  const status = getRxStatus(rx, today);
  if (status === 'pending') return 'A refill is already in progress';
  if (status === 'active') return `Available ${formatDate(rx.nextRefillDate)}`;
  return '';
}
