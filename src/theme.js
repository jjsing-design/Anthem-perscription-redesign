export const theme = {
  canvas: '#D5DBE3',
  bg: '#F3F5F8',
  white: '#FFFFFF',
  text: '#132033',
  muted: '#5E6B7A',
  faint: '#8B97A6',
  line: '#E3E8EE',
  blue: '#0050C8',
  blueDark: '#06243F',
  blueSoft: '#E7F0FB',
  green: '#0C7A43',
  greenSoft: '#E5F6EC',
  orange: '#8A4B08',
  orangeSoft: '#FFF1E0',
  red: '#9E2B25',
  redSoft: '#FDECEC',
  gray: '#5C6773',
  graySoft: '#EEF1F4',
  shadow: '0 1px 2px rgba(16, 32, 51, 0.04), 0 10px 28px rgba(16, 32, 51, 0.06)',
};

export const shellStyle = {
  width: '100%',
  maxWidth: 480,
  margin: '0 auto',
  minHeight: '100vh',
  background: theme.bg,
  boxShadow: '0 0 0 1px rgba(16, 32, 51, 0.06)',
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
  borderRadius: 18,
  boxShadow: theme.shadow,
  padding: 16,
};

export const screenStyle = {
  padding: 'calc(20px + env(safe-area-inset-top)) 20px calc(112px + env(safe-area-inset-bottom))',
};

export function primaryButton(disabled = false) {
  return {
    display: 'block',
    width: '100%',
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.2,
    padding: '14px 16px',
    borderRadius: 14,
    background: disabled ? '#D5DCE4' : theme.blue,
    color: disabled ? '#6D7886' : '#FFFFFF',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textAlign: 'center',
  };
}

export function secondaryButton(disabled = false) {
  return {
    ...primaryButton(disabled),
    background: theme.white,
    color: disabled ? '#6D7886' : theme.text,
    boxShadow: `inset 0 0 0 1.5px ${theme.line}`,
  };
}
