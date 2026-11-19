export default function PageHeader({ eyebrow, title, trailing }) {
  return (
    <header
      style={{
        background: 'linear-gradient(180deg, #4C8BFF 0%, #79B0FF 46%, #F4F7FB 100%)',
        color: '#FFFFFF',
        padding: 'calc(22px + env(safe-area-inset-top)) 20px 48px',
      }}
    >
      {eyebrow && (
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', opacity: 0.92 }}>
          {eyebrow}
        </p>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: eyebrow ? 8 : 0,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 32,
            lineHeight: 1.1,
            fontWeight: 800,
            letterSpacing: '-0.04em',
          }}
        >
          {title}
        </h1>
        {trailing}
      </div>
    </header>
  );
}
