import { theme } from '../theme';

const TONES = {
  refill_available: { label: 'Refill Available', color: theme.green, background: theme.greenSoft },
  active: { label: 'Active', color: theme.gray, background: theme.graySoft },
  pending: { label: 'Pending', color: theme.orange, background: theme.orangeSoft },
  paid: { label: 'Paid', color: theme.green, background: theme.greenSoft },
  denied: { label: 'Denied', color: theme.red, background: theme.redSoft },
};

export default function StatusBadge({ status }) {
  const tone = TONES[status] ?? TONES.active;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        padding: '4px 8px',
        background: tone.background,
        color: tone.color,
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      {tone.label}
    </span>
  );
}
