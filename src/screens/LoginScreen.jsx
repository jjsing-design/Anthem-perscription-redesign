import { useState } from 'react';
import { primaryButton, theme } from '../theme';

export default function LoginScreen({ onSignIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  function signIn(event) {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Enter your username and password.');
      return;
    }
    setError('');
    onSignIn();
  }

  function sendReset(event) {
    event.preventDefault();
    if (!username.trim()) {
      setError('Enter your username so we know where to send the link.');
      return;
    }
    setError('');
    setResetSent(true);
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.bg }}>
      <header
        style={{
          background: theme.blueDark,
          color: '#FFFFFF',
          padding: 'calc(36px + env(safe-area-inset-top)) 24px 64px',
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em' }}>anthem</div>
        <h1 style={{ margin: '28px 0 8px', fontSize: 30, lineHeight: 1.15, fontWeight: 700 }}>
          Sign in
        </h1>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.76)', fontSize: 16, lineHeight: 1.4 }}>
          Prescriptions, claims, and pharmacy costs in one place.
        </p>
      </header>

      <form
        onSubmit={showReset ? sendReset : signIn}
        style={{
          margin: '-32px 16px 0',
          background: theme.white,
          borderRadius: 20,
          boxShadow: theme.shadow,
          padding: 20,
          display: 'grid',
          gap: 14,
        }}
      >
        <label style={{ display: 'grid', gap: 6, fontSize: 14, fontWeight: 700 }}>
          Username
          <input
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter username"
            style={fieldStyle}
          />
        </label>

        {!showReset && (
          <label style={{ display: 'grid', gap: 6, fontSize: 14, fontWeight: 700 }}>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              style={fieldStyle}
            />
          </label>
        )}

        {error && (
          <p role="alert" style={{ margin: 0, color: theme.red, fontSize: 14, lineHeight: 1.4 }}>
            {error}
          </p>
        )}

        {resetSent && (
          <p aria-live="polite" style={{ margin: 0, color: theme.green, fontSize: 14, lineHeight: 1.4 }}>
            A reset link would be sent to the email on file for {username.trim()}.
          </p>
        )}

        <button type="submit" style={{ ...primaryButton(false), marginTop: 4 }}>
          {showReset ? 'Send reset link' : 'Sign in'}
        </button>

        <button
          type="button"
          onClick={() => {
            setShowReset((open) => !open);
            setResetSent(false);
            setError('');
          }}
          style={{ color: theme.blue, fontSize: 15, fontWeight: 700, padding: '4px 0 2px', textDecoration: 'underline' }}
        >
          {showReset ? 'Back to sign in' : 'Forgot password?'}
        </button>
      </form>

      <p style={{ margin: '24px 24px 0', color: theme.faint, fontSize: 13, lineHeight: 1.45, textAlign: 'center' }}>
        Sample member data for this redesign. Not a live Anthem sign-in.
      </p>
    </div>
  );
}

const fieldStyle = {
  width: '100%',
  border: `1.5px solid ${theme.line}`,
  borderRadius: 12,
  padding: '12px 14px',
  fontSize: 16,
  color: theme.text,
  background: theme.white,
};
