import { useState } from 'react';
import {
  HOME_DELIVERY_FEE,
  costBreakdown,
  expectedDate,
  formatDate,
  money,
  pharmacies,
} from '../data/mockData';
import { cardStyle, fieldStyle, fixedBarStyle, primaryButton, secondaryButton, theme } from '../theme';

const DELIVERY = [
  {
    id: 'home',
    label: 'Home delivery',
    detail: `Ships to the address on file in about 5 days · ${money(HOME_DELIVERY_FEE)} delivery fee`,
  },
  { id: 'pickup', label: 'Pharmacy pickup', detail: 'Usually ready tomorrow · no delivery fee' },
];

export default function RefillConfirmation({ prescription, onCancel, onConfirm }) {
  const [pharmacyId, setPharmacyId] = useState(pharmacies[0].id);
  const [delivery, setDelivery] = useState('pickup');
  const costs = costBreakdown(prescription, delivery);
  const pharmacy = pharmacies.find((item) => item.id === pharmacyId);

  function selectPharmacy(id) {
    const next = pharmacies.find((item) => item.id === id);
    const previous = pharmacies.find((item) => item.id === pharmacyId);
    setPharmacyId(id);
    if (next.type === 'mail') setDelivery('home');
    else if (previous?.type === 'mail') setDelivery('pickup');
  }

  return (
    <div style={{ padding: 'calc(16px + env(safe-area-inset-top)) 20px calc(124px + env(safe-area-inset-bottom))' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 44px', alignItems: 'center', marginBottom: 16 }}>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Back"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: theme.white,
            color: theme.text,
            boxShadow: theme.shadow,
            fontSize: 22,
            lineHeight: 1,
          }}
        >
          ‹
        </button>
        <h1 style={{ margin: 0, textAlign: 'center', fontSize: 18, letterSpacing: '-0.03em' }}>Confirm refill</h1>
      </div>

      <section aria-label="Medication" style={{ ...cardStyle, display: 'grid', gap: 6 }}>
        <h2 style={{ margin: 0, fontSize: 22, letterSpacing: '-0.03em' }}>{prescription.name}</h2>
        <p style={{ margin: 0, color: theme.muted, fontSize: 15 }}>
          {prescription.dosage} · {prescription.quantity} {prescription.form.toLowerCase()}s · {prescription.daysSupply}-day supply
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 14 }}>Last refilled {formatDate(prescription.lastRefilled)}</p>
        <p style={{ margin: 0, fontSize: 14, color: theme.muted }}>Prescribed by {prescription.prescriber}</p>
      </section>

      <div style={{ display: 'grid', gap: 8, marginTop: 18 }}>
        <label htmlFor="pharmacy" style={{ fontSize: 14, fontWeight: 700 }}>
          Pharmacy
        </label>
        <select
          id="pharmacy"
          value={pharmacyId}
          onChange={(event) => selectPharmacy(event.target.value)}
          style={fieldStyle}
        >
          {pharmacies.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.distance}
            </option>
          ))}
        </select>
      </div>

      <fieldset style={{ border: 'none', margin: '18px 0 0', padding: 0, display: 'grid', gap: 10 }}>
        <legend style={{ fontSize: 14, fontWeight: 700, padding: 0, marginBottom: 4 }}>Delivery method</legend>
        {DELIVERY.map((option) => {
          const selected = delivery === option.id;
          return (
            <label
              key={option.id}
              style={{
                ...cardStyle,
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                background: selected ? theme.blueSoft : theme.white,
                boxShadow: selected ? `inset 0 0 0 2px ${theme.blue}` : theme.shadow,
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="delivery"
                value={option.id}
                checked={selected}
                onChange={() => setDelivery(option.id)}
                style={{ marginTop: 3, accentColor: theme.blue }}
              />
              <span>
                <span style={{ display: 'block', fontWeight: 700 }}>{option.label}</span>
                <span style={{ display: 'block', marginTop: 2, color: theme.muted, fontSize: 14 }}>{option.detail}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <section aria-label="Cost breakdown" style={{ ...cardStyle, marginTop: 18, display: 'grid', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Cost breakdown</h2>
        <CostRow label="Medication" value={money(costs.medicationCost)} />
        <CostRow label="Plan pays" value={`−${money(costs.planPays)}`} />
        <CostRow label="Delivery" value={money(costs.deliveryFee)} />
        <div style={{ height: 1, background: theme.line }} />
        <CostRow label="Est. cost" value={money(costs.youPay)} strong />
        <p style={{ margin: 0, color: theme.muted, fontSize: 13, lineHeight: 1.4 }}>
          {pharmacy.name} · {pharmacy.distance}. Expected {expectedDate(delivery)}.
        </p>
      </section>

      <div
        style={{
          ...fixedBarStyle,
          bottom: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1.4fr',
          gap: 10,
          padding: '12px 20px calc(12px + env(safe-area-inset-bottom))',
          background: 'rgba(244, 247, 251, 0.96)',
          boxShadow: '0 -12px 32px rgba(59, 120, 240, 0.08)',
        }}
      >
        <button type="button" onClick={onCancel} style={secondaryButton(false)}>
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            onConfirm({
              pharmacy,
              delivery,
              costs,
              expected: expectedDate(delivery),
            })
          }
          style={primaryButton(false)}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

function CostRow({ label, value, strong = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: strong ? 17 : 15, fontWeight: strong ? 700 : 500 }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
