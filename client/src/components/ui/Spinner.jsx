export function Spinner({ size = 'md', color = 'currentColor' }) {
  const sizes = {
    sm: 16,
    md: 24,
    lg: 40,
  };

  const dimension = sizes[size];

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
    >
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M12 2a10 10 0 0 1 0 20" />
    </svg>
  );
}
