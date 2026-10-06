export default function Icon({ name, size = 24 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (name === 'home') {
    return (
      <svg {...common}>
        <path d="M4 10.6 12 4l8 6.6V20a1 1 0 0 1-1 1h-5.1v-6.1H10.1V21H5a1 1 0 0 1-1-1v-9.4z" />
      </svg>
    );
  }

  if (name === 'claims') {
    return (
      <svg {...common}>
        <path d="M7 3.5h6.4L18 8.1V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
        <path d="M13.2 3.6V8.2H18" />
        <path d="M8.5 12.5h7M8.5 16h4.6" />
      </svg>
    );
  }

  if (name === 'pharmacy') {
    return (
      <svg {...common}>
        <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4 7h16M4 12h16M4 17h16" />
      <circle cx="9" cy="7" r="2.2" fill="#ffffff" />
      <circle cx="15" cy="12" r="2.2" fill="#ffffff" />
      <circle cx="8" cy="17" r="2.2" fill="#ffffff" />
    </svg>
  );
}
