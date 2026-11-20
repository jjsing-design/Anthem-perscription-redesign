import { theme } from '../theme';

export default function PlacingOrder({ medication }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px 28px',
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'grid', justifyItems: 'center', gap: 16 }}>
        <div
          className="spinner"
          style={{
            width: 72,
            height: 72,
            borderRadius: 999,
            border: `6px solid ${theme.blueSoft}`,
            borderTopColor: theme.blue,
          }}
        />
        <div>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: '-0.04em' }}>Sending your refill</h1>
          <p style={{ margin: '8px 0 0', color: theme.muted, fontSize: 16, lineHeight: 1.4 }}>
            {medication}. This usually takes a moment.
          </p>
        </div>
      </div>
    </div>
  );
}
