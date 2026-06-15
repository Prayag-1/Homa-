export default function HomaLogo({ variant = 'red', size = 'md', className = '' }) {
  const sizes = {
    sm: { icon: 28, text: 18, sub: 8 },
    md: { icon: 36, text: 24, sub: 10 },
    lg: { icon: 48, text: 32, sub: 12 },
  };
  const s = sizes[size] || sizes.md;
  const color = variant === 'white' ? '#FFFFFF' : '#D10000';
  const subColor = variant === 'white' ? 'rgba(255,255,255,0.75)' : '#7F7F7F';

  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ userSelect: 'none' }}>
      <div
        style={{
          width: s.icon,
          height: s.icon,
          borderRadius: '50%',
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width={s.icon * 0.6} height={s.icon * 0.6} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="8" r="5" stroke="white" strokeWidth="1.5" fill="none" />
          <circle cx="12" cy="6" r="1" fill="white" />
          <path d="M9 13 Q12 11 15 13 L15.5 20 Q12 22 8.5 20 Z" fill="white" opacity="0.9" />
          <circle cx="11" cy="6.5" r="0.5" fill="white" />
          <path
            d="M10 8.5 Q11 9 12 8.5 Q13 8 13 9 Q13 10 12 10 Q11 10 11 9 Q11 8 10 8.5"
            fill="white"
            opacity="0.6"
          />
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: s.text,
            fontWeight: 600,
            color,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          homa
        </span>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: s.sub,
            color: subColor,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginTop: 2,
            lineHeight: 1,
          }}
        >
          Japanese Health & Beauty
        </span>
      </div>
    </div>
  );
}
