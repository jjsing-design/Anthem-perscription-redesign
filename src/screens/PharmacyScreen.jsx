import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import {
  canRefill,
  costBreakdown,
  formatDate,
  getRxStatus,
  money,
  refillHelper,
} from '../data/mockData';
import { cardStyle, contentStyle, primaryButton, sectionTitleStyle, theme } from '../theme';

function Ring({ label, pct }) {
  const size = 58;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ flex: 'none' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E6EEF8" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={theme.blue}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={theme.text}
        fontSize="13"
        fontWeight="800"
      >
        {label}
      </text>
    </svg>
  );
}

function Meter({ label, met, max }) {
  const pct = Math.min(100, Math.round((met / max) * 100));
  const remaining = max - met;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <Ring label={`${pct}%`} pct={pct} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>{label}</div>
        <div style={{ marginTop: 2, color: theme.muted, fontSize: 14 }}>
          {money(met)} of {money(max)}
        </div>
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={met}
          style={{ marginTop: 4, fontSize: 13, color: theme.blue, fontWeight: 700 }}
        >
          {money(remaining)} remaining
        </div>
      </div>
    </div>
  );
}

export default function PharmacyScreen({ plan, prescriptions, onRefill }) {
  return (
    <div>
      <PageHeader eyebrow={`${plan.year} pharmacy benefit`} title="Pharmacy" />
      <div style={contentStyle}>
        <section aria-label="Pharmacy plan" style={{ ...cardStyle, display: 'grid', gap: 18 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.blue }}>{plan.name}</div>
            <h2 style={{ margin: '4px 0 0', fontSize: 20, letterSpacing: '-0.03em' }}>Plan spending</h2>
          </div>
          <Meter label="Deductible" met={plan.deductibleMet} max={plan.deductibleMax} />
          <Meter label="Out-of-pocket max" met={plan.oopMet} max={plan.oopMax} />
        </section>

        <h2 style={sectionTitleStyle}>Active prescriptions</h2>
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
                    <h3 style={{ margin: 0, fontSize: 18, letterSpacing: '-0.03em' }}>{rx.name}</h3>
                    <p style={{ margin: '4px 0 0', color: theme.muted, fontSize: 14 }}>
                      {rx.dosage} · {rx.form}
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
                  <span style={{ color: theme.muted }}>Last refilled {formatDate(rx.lastRefilled)}</span>
                  <span style={{ fontWeight: 800 }}>Est. cost: {money(cost.youPay)}</span>
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
    </div>
  );
}
