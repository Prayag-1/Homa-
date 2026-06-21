export default function HomaLogo({
  variant = 'red',
  size = 'md',
  className = '',
  imageSrc = '',
  imageAlt = 'Homa logo',
  showText = true,
}) {
  const sizes = {
    sm: { icon: 56, text: 36, sub: 16 },
    md: { icon: 72, text: 48, sub: 20 },
    lg: { icon: 96, text: 64, sub: 24 },
  };
  const s = sizes[size] || sizes.md;
  const color = variant === 'white' ? '#FFFFFF' : '#D10000';
  const subColor = variant === 'white' ? 'rgba(255,255,255,0.75)' : '#7F7F7F';

  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ userSelect: 'none' }}>
      {imageSrc && (
        <div
          className="flex-shrink-0 overflow-hidden"
          style={{
            width: Math.round(s.icon * 1.8),
            height: s.icon,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label={imageAlt}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            className="h-full w-full object-contain"
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
