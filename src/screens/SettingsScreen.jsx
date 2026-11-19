import PageHeader from '../components/PageHeader';
import { cardStyle, contentStyle, secondaryButton, theme } from '../theme';

export default function SettingsScreen({ user, onLogout }) {
  return (
    <div>
      <PageHeader eyebrow={user.planName} title="Settings" />
      <div style={contentStyle}>
        <section aria-label="Member" style={{ ...cardStyle, display: 'grid', gap: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.blue }}>Signed in</div>
          <h2 style={{ margin: 0, fontSize: 22, letterSpacing: '-0.03em' }}>
            {user.firstName} {user.lastName}
          </h2>
          <p style={{ margin: '4px 0 0', color: theme.muted, fontSize: 14 }}>Member ID {user.memberId}</p>
        </section>

        <button type="button" onClick={onLogout} style={{ ...secondaryButton(false), marginTop: 16 }}>
          Log out
        </button>
      </div>
    </div>
  );
}
