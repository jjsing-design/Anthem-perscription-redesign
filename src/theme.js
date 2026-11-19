export const theme = {
  canvas: '#7EB0FF',
  bg: '#F4F7FB',
  white: '#FFFFFF',
  text: '#1B2437',
  muted: '#8B95A8',
  faint: '#A8B3C4',
  line: '#E6EDF5',
  blue: '#3B78F0',
  blueBright: '#5B95FF',
  blueSoft: '#E8F1FF',
  green: '#1F9D55',
  greenSoft: '#E7F8EE',
  orange: '#C26A12',
  orangeSoft: '#FFF3E4',
  red: '#E14B4B',
  redSoft: '#FDECEC',
  redText: '#B42318',
  yellow: '#7A5B00',
  yellowSoft: '#FFF4C2',
  gray: '#6D7890',
  graySoft: '#EEF2F7',
  shadow: '0 10px 28px rgba(59, 120, 240, 0.08)',
};

export const shellStyle = {
  width: '100%',
  maxWidth: 480,
  margin: '0 auto',
  minHeight: '100vh',
  background: theme.bg,
  boxShadow: '0 24px 60px rgba(37, 99, 235, 0.16)',
  position: 'relative',
};

export const fixedBarStyle = {
  position: 'fixed',
  left: 0,
  right: 0,
  margin: '0 auto',
  width: '100%',
  maxWidth: 480,
  zIndex: 30,
};

export const cardStyle = {
  background: theme.white,
  borderRadius: 24,
  boxShadow: theme.shadow,
  border: `1px solid ${theme.line}`,
  padding: 16,
};

export const contentStyle = {
  padding: '0 20px calc(124px + env(safe-area-inset-bottom))',
  marginTop: -20,
};

export const sectionTitleStyle = {
  margin: '22px 0 12px',
  fontSize: 18,
  fontWeight: 800,
  letterSpacing: '-0.03em',
  color: theme.text,
};

export const fieldStyle = {
  width: '100%',
  border: 'none',
  borderRadius: 16,
  padding: '14px 16px',
  fontSize: 16,
  color: theme.text,
  background: '#F3F6FB',
};

export function primaryButton(disabled = false) {
  return {
    display: 'block',
    width: '100%',
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.2,
    padding: '15px 16px',
    borderRadius: 16,
    background: disabled ? '#E4EAF3' : 'linear-gradient(180deg, #5B95FF 0%, #3B78F0 100%)',
    color: disabled ? '#8B95A8' : '#FFFFFF',
    boxShadow: disabled ? 'none' : '0 8px 18px rgba(59, 120, 240, 0.28)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textAlign: 'center',
  };
}

export function secondaryButton(disabled = false) {
  return {
    ...primaryButton(disabled),
    background: theme.white,
    color: disabled ? '#8B95A8' : theme.text,
    boxShadow: 'none',
    border: `1.5px solid ${theme.line}`,
  };
}
