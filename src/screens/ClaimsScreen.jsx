import { useRef, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { formatDate, money } from '../data/mockData';
import { cardStyle, primaryButton, screenStyle, secondaryButton, theme } from '../theme';

const CLAIM_TYPES = ['Office visit', 'Lab work', 'Imaging', 'Urgent care', 'Prescription'];

const emptyForm = {
  title: 'Office visit',
  provider: '',
  date: '2026-10-06',
  amount: '',
};

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
    <div style={screenStyle}>
      <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.15 }}>Claims</h1>
      <p style={{ margin: '6px 0 18px', color: theme.muted, fontSize: 15 }}>
        Recent activity, plus a way to send a new claim.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <button type="button" onClick={showHistory} style={actionCardStyle}>
          <span aria-hidden="true" style={{ fontSize: 26 }}>📂</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Claim History</span>
          <span style={{ color: theme.muted, fontSize: 13 }}>Jump to recent claims</span>
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
          <span aria-hidden="true" style={{ fontSize: 26 }}>📝</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Submit Claim</span>
          <span style={{ color: theme.muted, fontSize: 13 }}>Send one for review</span>
        </button>
      </div>

      {formOpen && (
        <form onSubmit={submit} style={{ ...cardStyle, marginTop: 12, display: 'grid', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>New claim</h2>
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

      <h2 ref={listRef} id="claim-history" style={{ margin: '26px 0 12px', fontSize: 18, scrollMarginTop: 16 }}>
        Recent claims
      </h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {claims.map((claim) => (
          <article key={claim.id} style={{ ...cardStyle, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <h3 style={{ margin: 0, fontSize: 17 }}>{claim.title}</h3>
              <StatusBadge status={claim.status} />
            </div>
            <p style={{ margin: 0, color: theme.muted, fontSize: 14 }}>{claim.provider}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
              <span>{formatDate(claim.date)}</span>
              <span style={{ fontWeight: 700 }}>Your cost {money(claim.amount)}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

const actionCardStyle = {
  ...cardStyle,
  display: 'grid',
  gap: 6,
  textAlign: 'left',
  alignContent: 'start',
  minHeight: 132,
};

const labelStyle = {
  display: 'grid',
  gap: 6,
  fontSize: 14,
  fontWeight: 700,
};

const fieldStyle = {
  width: '100%',
  border: `1.5px solid ${theme.line}`,
  borderRadius: 12,
  padding: '12px 14px',
  fontSize: 16,
  color: theme.text,
  background: theme.white,
};
