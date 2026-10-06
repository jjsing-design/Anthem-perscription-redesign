import Icon from './Icons';
import { fixedBarStyle, theme } from '../theme';

const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'claims', label: 'Claims', icon: 'claims' },
  { id: 'pharmacy', label: 'Pharmacy', icon: 'pharmacy' },
  { id: 'settings', label: 'Settings', icon: 'settings', disabled: true },
];

export default function BottomNav({ current, onChange }) {
  return (
    <nav
      aria-label="Primary"
      style={{
        ...fixedBarStyle,
        bottom: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        background: theme.white,
        borderTop: `1px solid ${theme.line}`,
        padding: '6px 8px calc(8px + env(safe-area-inset-bottom))',
      }}
    >
      {TABS.map((tab) => {
        const active = current === tab.id;
        const color = tab.disabled ? '#B7BEC7' : active ? theme.blue : theme.muted;

        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            aria-current={active ? 'page' : undefined}
            aria-label={tab.disabled ? 'Settings, unavailable' : tab.label}
            onClick={() => onChange(tab.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '4px 0',
              color,
              cursor: tab.disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <span
              style={{
                width: 56,
                height: 32,
                borderRadius: 16,
                display: 'grid',
                placeItems: 'center',
                background: active ? theme.blueSoft : 'transparent',
              }}
            >
              <Icon name={tab.icon} />
            </span>
            <span style={{ fontSize: 12, fontWeight: active ? 700 : 600 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
