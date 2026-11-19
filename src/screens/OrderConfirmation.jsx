import { money } from '../data/mockData';
import { fixedBarStyle, primaryButton, theme, cardStyle } from '../theme';

export default function OrderConfirmation({ order, onBack }) {
  const deliveryLabel = order.delivery === 'home' ? 'Home delivery' : 'Pharmacy pickup';
  const nextSteps = order.delivery === 'home'
    ? [
        'Anthem Home Delivery will fill this prescription.',
        "You'll get a message when it ships.",
        'Most home deliveries arrive in 3–5 days.',
      ]
    : [
        'The pharmacy will fill this prescription.',
        "You'll get a message when it's ready for pickup.",
        'Bring your member ID and a photo ID.',
      ];

  return (
    <div style={{ padding: 'calc(36px + env(safe-area-inset-top)) 20px calc(124px + env(safe-area-inset-bottom))' }}>
      <div style={{ display: 'grid', justifyItems: 'center', textAlign: 'center', gap: 8 }}>
        <div
          style={{
            width: 112,
            height: 112,
            borderRadius: 999,
            background: theme.blueSoft,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
            <circle cx="38" cy="38" r="28" fill={theme.green} />
            <path d="M25 39.5 33.5 48 52 29" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={{ margin: '10px 0 0', fontSize: 32, letterSpacing: '-0.04em' }}>Order confirmed</h1>
        <p style={{ margin: 0, color: theme.muted, fontSize: 16 }}>Order {order.orderNumber}</p>
      </div>

      <section aria-label="Order details" style={{ ...cardStyle, marginTop: 22, display: 'grid', gap: 12 }}>
        <Detail label="Medication" value={order.medication} />
        <Detail label="Pharmacy" value={`${order.pharmacy.name} · ${order.pharmacy.distance}`} />
        <Detail label="Delivery" value={deliveryLabel} />
        <Detail label="Expected delivery" value={order.expected} />
        <Detail label="Est. cost" value={money(order.youPay)} />
      </section>

      <section aria-label="What's next" style={{ ...cardStyle, marginTop: 12 }}>
        <h2 style={{ margin: '0 0 10px', fontSize: 18 }}>What's next</h2>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8, color: theme.text, lineHeight: 1.4 }}>
          {nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </section>

      <div
        style={{
          ...fixedBarStyle,
          bottom: 0,
          padding: '12px 20px calc(12px + env(safe-area-inset-bottom))',
          background: 'rgba(244, 247, 251, 0.96)',
          boxShadow: '0 -12px 32px rgba(59, 120, 240, 0.08)',
        }}
      >
        <button type="button" onClick={onBack} style={primaryButton(false)}>
          Back
        </button>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div style={{ display: 'grid', gap: 2 }}>
      <span style={{ fontSize: 13, color: theme.muted, fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
