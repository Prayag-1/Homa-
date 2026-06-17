export default function HomaLogo({
  variant = 'red',
  size = 'md',
  className = '',
  imageSrc = '',
  imageAlt = 'Homa logo',
  showText = true,
}) {
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
      {imageSrc && (
        <div
          className="flex-shrink-0 overflow-hidden rounded-lg border border-homa-red/10 bg-white/70"
          style={{
            width: Math.round(s.icon * 1.8),
            height: s.icon,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: variant === 'white' ? 'none' : '0 1px 8px rgba(209, 0, 0, 0.06)',
          }}
          aria-label={imageAlt}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            className="h-full w-full object-contain p-1.5"
            draggable="false"
          />
        </div>
      )}
      {showText && (
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
      )}
    </div>
  );
}
