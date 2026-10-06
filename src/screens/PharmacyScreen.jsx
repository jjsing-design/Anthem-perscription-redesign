import StatusBadge from '../components/StatusBadge';
import {
  canRefill,
  costBreakdown,
  formatDate,
  getRxStatus,
  money,
  refillHelper,
} from '../data/mockData';
import { cardStyle, primaryButton, screenStyle, theme } from '../theme';

function Meter({ label, met, max }) {
  const pct = Math.min(100, Math.round((met / max) * 100));
  const remaining = max - met;

  return (
    <div>
      <div style={{ display: 'grid', gap: 2, marginBottom: 8, fontSize: 14 }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        <span style={{ color: theme.muted }}>{money(met)} of {money(max)}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={met}
        style={{ height: 8, borderRadius: 99, background: '#E6EAF0', overflow: 'hidden' }}
      >
        <div style={{ width: `${pct}%`, height: '100%', background: theme.blue, borderRadius: 99 }} />
      </div>
      <div style={{ marginTop: 6, fontSize: 13, color: theme.muted }}>{money(remaining)} remaining</div>
    </div>
  );
}

export default function PharmacyScreen({ plan, prescriptions, onRefill }) {
  return (
    <div style={screenStyle}>
      <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.15 }}>Pharmacy</h1>
      <p style={{ margin: '6px 0 18px', color: theme.muted, fontSize: 15 }}>
        What you can refill, what it costs, and where your plan stands.
      </p>

      <section aria-label="Pharmacy plan" style={{ ...cardStyle, display: 'grid', gap: 18 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.blue, letterSpacing: '0.02em' }}>
            {plan.year} plan year
          </div>
          <h2 style={{ margin: '4px 0 0', fontSize: 20 }}>{plan.name}</h2>
        </div>
        <Meter label="Deductible" met={plan.deductibleMet} max={plan.deductibleMax} />
        <Meter label="Out-of-pocket max" met={plan.oopMet} max={plan.oopMax} />
      </section>

      <h2 style={{ margin: '26px 0 12px', fontSize: 18 }}>Active prescriptions</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {prescriptions.map((rx) => {
          const status = getRxStatus(rx);
          const ready = canRefill(rx);
          const helper = refillHelper(rx);
          const cost = costBreakdown(rx);

          return (
            <article key={rx.id} style={{ ...cardStyle, display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{rx.name}</h3>
                  <p style={{ margin: '4px 0 0', color: theme.muted, fontSize: 14 }}>
                    {rx.dosage} · {rx.form}
                  </p>
                </div>
                <StatusBadge status={status} />
              </div>

              <div style={{ display: 'grid', gap: 4, fontSize: 14 }}>
                <div>Last refilled {formatDate(rx.lastRefilled)}</div>
                <div style={{ fontWeight: 700 }}>Est. cost: {money(cost.youPay)}</div>
              </div>

              <div>
                <button
                  type="button"
                  disabled={!ready}
                  aria-label={`Refill ${rx.name} now`}
                  onClick={() => onRefill(rx)}
                  style={primaryButton(!ready)}
                >
                  Refill Now
                </button>
                {helper && (
                  <p style={{ margin: '8px 0 0', color: theme.muted, fontSize: 13 }}>{helper}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
