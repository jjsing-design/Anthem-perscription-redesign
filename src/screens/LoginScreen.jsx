import { useState } from 'react';
import { fieldStyle, primaryButton, theme } from '../theme';

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
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #4C8BFF 0%, #8EBEFF 34%, #F4F7FB 68%)',
      }}
    >
      <header
        style={{
          color: '#FFFFFF',
          padding: 'calc(48px + env(safe-area-inset-top)) 24px 28px',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'lowercase', opacity: 0.9 }}>
          anthem
        </div>
        <h1 style={{ margin: '18px 0 8px', fontSize: 36, lineHeight: 1.05, fontWeight: 800, letterSpacing: '-0.04em' }}>
          {showReset ? 'Reset password' : 'Sign in'}
        </h1>
        <p style={{ margin: 0, maxWidth: 280, color: 'rgba(255,255,255,0.88)', fontSize: 16, lineHeight: 1.4 }}>
          Prescriptions, claims, and pharmacy costs in one place.
        </p>
      </header>

      <form
        onSubmit={showReset ? sendReset : signIn}
        style={{
          margin: '0 20px',
          background: theme.white,
          borderRadius: 28,
          boxShadow: '0 16px 40px rgba(59, 120, 240, 0.12)',
          padding: 20,
          display: 'grid',
          gap: 14,
        }}
      >
        <label style={labelStyle}>
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
          <label style={labelStyle}>
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
          style={{ color: theme.blue, fontSize: 15, fontWeight: 700, padding: '4px 0 2px' }}
        >
          {showReset ? 'Back to sign in' : 'Forgot password?'}
        </button>
      </form>

      <p style={{ margin: '24px 28px 0', color: theme.muted, fontSize: 13, lineHeight: 1.45, textAlign: 'center' }}>
        Sample member data for this redesign. Not a live Anthem sign-in.
      </p>
    </div>
  );
}

const labelStyle = {
  display: 'grid',
  gap: 8,
  fontSize: 13,
  fontWeight: 700,
  color: theme.text,
};
