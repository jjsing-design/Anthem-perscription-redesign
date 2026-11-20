import Icon from './Icons';
import { fixedBarStyle, theme } from '../theme';

const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'claims', label: 'Claims', icon: 'claims' },
  { id: 'pharmacy', label: 'Pharmacy', icon: 'pharmacy' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
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
        boxShadow: '0 -12px 32px rgba(59, 120, 240, 0.08)',
        padding: '8px 6px calc(10px + env(safe-area-inset-bottom))',
      }}
    >
      {TABS.map((tab) => {
        const active = current === tab.id;
        const color = active ? theme.blue : '#A8B3C4';

        return (
          <button
            key={tab.id}
            type="button"
            aria-current={active ? 'page' : undefined}
            aria-label={tab.label}
            onClick={() => onChange(tab.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '4px 0 2px',
              color,
              cursor: 'pointer',
            }}
          >
            <Icon name={tab.icon} />
            <span
              style={{
                width: 16,
                height: 3,
                borderRadius: 99,
                background: active ? theme.blue : 'transparent',
              }}
            />
            <span style={{ fontSize: 11, fontWeight: active ? 800 : 600 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
