import { useRef, useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { formatDate, money } from '../data/mockData';
import { cardStyle, contentStyle, fieldStyle, primaryButton, secondaryButton, sectionTitleStyle, theme } from '../theme';

const CLAIM_TYPES = ['Office visit', 'Lab work', 'Imaging', 'Urgent care', 'Prescription'];

const emptyForm = {
  title: 'Office visit',
  provider: '',
  date: '2026-10-06',
  amount: '',
};

function ActionIcon({ children, tint, color }) {
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
      }}
    >
      {children}
    </span>
  );
}

export default function ClaimsScreen({ claims, onSubmitClaim }) {
  const listRef = useRef(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  function showHistory() {
    setFormOpen(false);
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.provider.trim() || !form.date || form.amount === '' || Number.isNaN(amount) || amount < 0) {
      setError('Add a provider, date, and cost of $0 or more.');
      return;
    }
    onSubmitClaim({
      id: `claim-${Date.now()}`,
      title: form.title,
      provider: form.provider.trim(),
      date: form.date,
      amount,
      status: 'pending',
    });
    setForm(emptyForm);
    setError('');
    setFormOpen(false);
    requestAnimationFrame(() => {
      listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  return (
    <div>
      <PageHeader eyebrow="History and new claims" title="Claims" />
      <div style={contentStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button type="button" onClick={showHistory} style={actionCardStyle}>
            <ActionIcon tint={theme.blueSoft} color={theme.blue}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M7 3.5h6.4L18 8.1V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
                <path d="M13.2 3.6V8.2H18" />
              </svg>
            </ActionIcon>
            <span style={actionTitle}>Claim History</span>
            <span style={actionDetail}>Jump to recent claims</span>
          </button>
          <button
            type="button"
            aria-expanded={formOpen}
            onClick={() => {
              setFormOpen((open) => !open);
              setError('');
            }}
            style={actionCardStyle}
          >
            <ActionIcon tint="#FDECEC" color={theme.red}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </ActionIcon>
            <span style={actionTitle}>Submit Claim</span>
            <span style={actionDetail}>Send one for review</span>
          </button>
        </div>

        {formOpen && (
          <form onSubmit={submit} style={{ ...cardStyle, marginTop: 12, display: 'grid', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, letterSpacing: '-0.03em' }}>New claim</h2>
            <label style={labelStyle}>
              Claim type
              <select value={form.title} onChange={(event) => update('title', event.target.value)} style={fieldStyle}>
                {CLAIM_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label style={labelStyle}>
              Provider
              <input
                value={form.provider}
                onChange={(event) => update('provider', event.target.value)}
                placeholder="Provider or facility"
                style={fieldStyle}
              />
            </label>
            <label style={labelStyle}>
              Date of service
              <input type="date" value={form.date} onChange={(event) => update('date', event.target.value)} style={fieldStyle} />
            </label>
            <label style={labelStyle}>
              Your cost
              <input
                inputMode="decimal"
                value={form.amount}
                onChange={(event) => update('amount', event.target.value)}
                placeholder="0.00"
                style={fieldStyle}
              />
            </label>
            {error && (
              <p role="alert" style={{ margin: 0, color: theme.red, fontSize: 14 }}>
                {error}
              </p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 10 }}>
              <button type="button" onClick={() => setFormOpen(false)} style={secondaryButton(false)}>
                Cancel
              </button>
              <button type="submit" style={primaryButton(false)}>
                Submit
              </button>
            </div>
          </form>
        )}

        <h2 ref={listRef} id="claim-history" style={{ ...sectionTitleStyle, scrollMarginTop: 16 }}>
          Recent claims
        </h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {claims.map((claim) => (
            <article key={claim.id} style={{ ...cardStyle, display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: 17, letterSpacing: '-0.02em' }}>{claim.title}</h3>
                <StatusBadge status={claim.status} />
              </div>
              <p style={{ margin: 0, color: theme.muted, fontSize: 14 }}>{claim.provider}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
                <span style={{ color: theme.muted }}>{formatDate(claim.date)}</span>
                <span style={{ fontWeight: 800 }}>Your cost {money(claim.amount)}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

const actionCardStyle = {
  ...cardStyle,
  display: 'grid',
  gap: 8,
  textAlign: 'left',
  alignContent: 'start',
  minHeight: 148,
};

const actionTitle = {
  fontSize: 16,
  fontWeight: 800,
  letterSpacing: '-0.02em',
};

const actionDetail = {
  color: theme.muted,
  fontSize: 13,
  lineHeight: 1.35,
};

const labelStyle = {
  display: 'grid',
  gap: 8,
  fontSize: 13,
  fontWeight: 700,
};
