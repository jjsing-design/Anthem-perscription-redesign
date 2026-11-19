import { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader';
import {
  canRefill,
  costBreakdown,
  formatDate,
  getRxStatus,
  money,
} from '../data/mockData';
import { cardStyle, contentStyle, sectionTitleStyle, theme } from '../theme';

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

function ShortcutIcon({ children, tint = theme.blueSoft, color = theme.blue }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 42,
        height: 42,
        borderRadius: 14,
        background: tint,
        color,
        display: 'grid',
        placeItems: 'center',
        flex: 'none',
      }}
    >
      {children}
    </span>
  );
}

export default function HomeScreen({ user, prescriptions, claims, plan, onNavigate }) {
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState('');
  const [thinking, setThinking] = useState(false);
  const thinkTimer = useRef(null);
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  useEffect(() => () => window.clearTimeout(thinkTimer.current), []);

  function ask(nextQuery = query) {
    const question = typeof nextQuery === 'string' ? nextQuery : query;
    setQuery(question);
    setReply('');
    setThinking(true);
    window.clearTimeout(thinkTimer.current);
    thinkTimer.current = window.setTimeout(() => {
      setReply(buildReply(question, prescriptions, claims, plan));
      setThinking(false);
    }, 900);
  }

  return (
    <div>
      <PageHeader
        eyebrow={`${greeting(new Date())} · ${today}`}
        title={`Hello, ${user.firstName}!`}
        trailing={
          <span
            aria-hidden="true"
            style={{
              width: 46,
              height: 46,
              borderRadius: 999,
              background: '#FFFFFF',
              color: theme.blue,
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              flex: 'none',
              boxShadow: '0 8px 18px rgba(20, 60, 140, 0.16)',
            }}
          >
            {user.firstName[0]}
            {user.lastName[0]}
          </span>
        }
      />

      <div style={contentStyle}>
        <section aria-label="Sydney AI assistant" style={{ ...cardStyle, display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ShortcutIcon>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 3.5 13.6 8.4 18.5 10 13.6 11.6 12 16.5 10.4 11.6 5.5 10 10.4 8.4 12 3.5z" />
                <path d="M18 14.5 18.7 16.3 20.5 17 18.7 17.7 18 19.5 17.3 17.7 15.5 17 17.3 16.3 18 14.5z" />
              </svg>
            </ShortcutIcon>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: theme.blue }}>Sydney</span>
                <span
                  style={{
                    borderRadius: 999,
                    padding: '2px 7px',
                    background: 'linear-gradient(180deg, #5B95FF 0%, #3B78F0 100%)',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                  }}
                >
                  AI
                </span>
              </div>
              <h2 style={{ margin: '2px 0 0', fontSize: 18, letterSpacing: '-0.03em' }}>AI assistant</h2>
            </div>
          </div>
          <p style={{ margin: '-4px 0 0', color: theme.muted, fontSize: 14, lineHeight: 1.4 }}>
            Ask in your own words. Sydney reads your refills, claims, and plan spending.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask();
            }}
            style={{ display: 'flex', gap: 8 }}
          >
            <input
              aria-label="Ask Sydney, the AI assistant"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Refill, claim, or cost"
              style={{
                flex: 1,
                minWidth: 0,
                border: 'none',
                borderRadius: 16,
                padding: '13px 14px',
                fontSize: 16,
                color: theme.text,
                background: '#F3F6FB',
              }}
            />
            <button
              type="submit"
              disabled={thinking}
              style={{
                borderRadius: 16,
                padding: '0 16px',
                background: thinking ? '#E4EAF3' : 'linear-gradient(180deg, #5B95FF 0%, #3B78F0 100%)',
                color: thinking ? '#8B95A8' : '#FFFFFF',
                fontWeight: 800,
                fontSize: 15,
                boxShadow: thinking ? 'none' : '0 8px 16px rgba(59, 120, 240, 0.25)',
              }}
            >
              Ask
            </button>
          </form>

          {thinking && (
            <p
              role="status"
              style={{
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: theme.blueSoft,
                color: theme.blue,
                borderRadius: 16,
                padding: 12,
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              <span aria-hidden="true" style={{ display: 'inline-flex', gap: 4 }}>
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="ai-dot"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 99,
                      background: theme.blue,
                      animationDelay: `${dot * 0.15}s`,
                    }}
                  />
                ))}
              </span>
              Sydney is thinking
            </p>
          )}

          {reply && (
            <p
              aria-live="polite"
              style={{
                margin: 0,
                background: theme.blueSoft,
                color: theme.text,
                borderRadius: 16,
                padding: 12,
                lineHeight: 1.45,
                fontSize: 15,
              }}
            >
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
                  background: theme.blueSoft,
                  color: theme.blue,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <h2 style={sectionTitleStyle}>Quick access</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button type="button" onClick={() => onNavigate('pharmacy')} style={metricCard}>
            <ShortcutIcon>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </ShortcutIcon>
            <span style={metricTitle}>Prescriptions</span>
            <span style={metricDetail}>Refills, status, and cost</span>
          </button>
          <button type="button" onClick={() => onNavigate('claims')} style={metricCard}>
            <ShortcutIcon tint="#FDECEC" color={theme.red}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M7 3.5h6.4L18 8.1V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
                <path d="M13.2 3.6V8.2H18M8.5 12.5h7M8.5 16h4.6" />
              </svg>
            </ShortcutIcon>
            <span style={metricTitle}>Claims</span>
            <span style={metricDetail}>History and new claims</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('pharmacy')}
          style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', marginTop: 12 }}
        >
          <ShortcutIcon>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3.5" y="6" width="17" height="12" rx="3" />
              <path d="M3.5 10h17" />
            </svg>
          </ShortcutIcon>
          <span style={{ display: 'grid', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' }}>Pharmacy plan</span>
            <span style={{ fontSize: 13, color: theme.muted }}>{plan.name} · deductible and out-of-pocket</span>
          </span>
          <span aria-hidden="true" style={{ marginLeft: 'auto', color: theme.faint, fontSize: 22, lineHeight: 1 }}>
            ›
          </span>
        </button>
      </div>
    </div>
  );
}

const metricCard = {
  ...cardStyle,
  display: 'grid',
  gap: 10,
  textAlign: 'left',
  alignContent: 'start',
  minHeight: 148,
};

const metricTitle = {
  fontSize: 16,
  fontWeight: 800,
  letterSpacing: '-0.02em',
};

const metricDetail = {
  fontSize: 13,
  color: theme.muted,
  lineHeight: 1.35,
};
