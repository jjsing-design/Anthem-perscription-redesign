import { useState } from 'react';
import {
  canRefill,
  costBreakdown,
  formatDate,
  getRxStatus,
  money,
} from '../data/mockData';
import { cardStyle, screenStyle, theme } from '../theme';

const SUGGESTIONS = [
  { label: 'Refill status', question: 'What can I refill?' },
  { label: 'Deductible', question: 'How much deductible is left?' },
  { label: 'Latest claim', question: 'What is my latest claim?' },
];

const STATUS_LABEL = {
  refill_available: 'Refill Available',
  active: 'Active',
  pending: 'Pending',
  paid: 'Paid',
  denied: 'Denied',
};

function greeting(date) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function buildReply(question, prescriptions, claims, plan) {
  const q = question.trim().toLowerCase();
  if (!q) return 'Ask about a refill, a claim, or your deductible.';

  if (q.includes('deduct') || q.includes('out-of-pocket') || q.includes('oop') || q.includes('plan')) {
    const deductibleLeft = plan.deductibleMax - plan.deductibleMet;
    const oopLeft = plan.oopMax - plan.oopMet;
    return `You've met ${money(plan.deductibleMet)} of your ${money(plan.deductibleMax)} pharmacy deductible, with ${money(deductibleLeft)} left. Out-of-pocket remaining is ${money(oopLeft)}.`;
  }

  if (q.includes('claim')) {
    const latest = claims[0];
    if (!latest) return 'No claims are on file yet.';
    return `${latest.title} on ${formatDate(latest.date)} is ${STATUS_LABEL[latest.status]}. Your cost on that claim is ${money(latest.amount)}.`;
  }

  if (q.includes('refill') || q.includes('prescription') || q.includes('pharmacy') || q.includes('cost')) {
    const ready = prescriptions.filter((rx) => canRefill(rx));
    if (ready.length === 0) {
      return 'Nothing is ready to refill today. Open Pharmacy to see last refill dates and which orders are pending.';
    }
    return ready
      .map((rx) => `${rx.name} ${rx.dosage} is ready to refill. Est. cost: ${money(costBreakdown(rx).youPay)}.`)
      .join(' ');
  }

  const pending = prescriptions.filter((rx) => getRxStatus(rx) === 'pending').length;
  return `I can check refills, claims, and pharmacy spending. ${pending} prescription${pending === 1 ? ' is' : 's are'} pending right now.`;
}

export default function HomeScreen({ user, prescriptions, claims, plan, onNavigate }) {
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState('');

  function ask(nextQuery = query) {
    setQuery(nextQuery);
    setReply(buildReply(nextQuery, prescriptions, claims, plan));
  }

  const cards = [
    { emoji: '💊', title: 'Prescriptions', detail: 'Refills, status, and cost', target: 'pharmacy' },
    { emoji: '🧾', title: 'Claims', detail: 'History and new claims', target: 'claims' },
    { emoji: '💳', title: 'Pharmacy plan', detail: 'Deductible and out-of-pocket', target: 'pharmacy' },
  ];

  return (
    <div style={screenStyle}>
      <p style={{ margin: 0, color: theme.muted, fontSize: 15, fontWeight: 600 }}>{greeting(new Date())}</p>
      <h1 style={{ margin: '4px 0 0', fontSize: 30, lineHeight: 1.15 }}>{user.firstName}</h1>
      <p style={{ margin: '6px 0 20px', color: theme.muted, fontSize: 14 }}>{user.planName}</p>

      <section
        aria-label="Sydney"
        style={{
          background: theme.blueDark,
          color: '#FFFFFF',
          borderRadius: 22,
          padding: 18,
          display: 'grid',
          gap: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)' }}>
            Sydney
          </div>
          <h2 style={{ margin: '4px 0 0', fontSize: 22, lineHeight: 1.25 }}>How can I help?</h2>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            ask();
          }}
          style={{ display: 'flex', gap: 8 }}
        >
          <input
            aria-label="Ask Sydney"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ask about a refill, claim, or cost"
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              borderRadius: 12,
              padding: '12px 14px',
              fontSize: 16,
              color: theme.text,
              background: '#FFFFFF',
            }}
          />
          <button
            type="submit"
            style={{
              borderRadius: 12,
              padding: '0 16px',
              background: theme.blue,
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Ask
          </button>
        </form>

        {reply && (
          <p aria-live="polite" style={{ margin: 0, background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, lineHeight: 1.45, fontSize: 15 }}>
            {reply}
          </p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SUGGESTIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => ask(item.question)}
              style={{
                borderRadius: 999,
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.12)',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {cards.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => onNavigate(card.target)}
            style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left' }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: theme.bg,
                display: 'grid',
                placeItems: 'center',
                fontSize: 24,
                flex: 'none',
              }}
            >
              {card.emoji}
            </span>
            <span style={{ display: 'grid', gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>{card.title}</span>
              <span style={{ fontSize: 14, color: theme.muted }}>{card.detail}</span>
            </span>
            <span aria-hidden="true" style={{ marginLeft: 'auto', color: theme.faint, fontSize: 24, lineHeight: 1 }}>
              ›
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
