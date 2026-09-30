export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
}) {
  const baseStyles = [
    'inline-flex items-center justify-center gap-2 rounded-pill font-body font-semibold',
    'min-h-[44px]',
    'transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-homa-red',
  ].join(' ');

  const variants = {
    primary: [
      'bg-homa-red text-white uppercase tracking-[0.1em]',
      'hover:-translate-y-px hover:bg-homa-red-dark hover:shadow-[0_4px_16px_rgba(209,0,0,0.3)]',
      'active:translate-y-0',
    ].join(' '),
    outline: [
      'border-2 border-homa-red bg-transparent text-homa-red',
      'hover:bg-homa-red hover:text-white',
    ].join(' '),
    ghost: 'bg-transparent text-homa-black hover:text-homa-red',
    white: 'bg-white text-homa-red hover:bg-homa-blush',
  };

  const sizes = {
    sm: 'px-5 py-2 text-xs',
    md: 'px-7 py-3 text-sm',
    lg: 'px-10 py-4 text-base',
  };

  const spinnerColor = variant === 'primary' ? 'border-white' : 'border-current';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    >
      {loading && (
        <span
          aria-hidden="true"
          className={`h-4 w-4 rounded-full border-2 ${spinnerColor} border-t-transparent animate-spin`}
        />
      )}
      {children}
    </button>
  );
}
