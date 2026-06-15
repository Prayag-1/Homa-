export function Input({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  register = {},
  className = '',
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="mb-2 block font-body text-xs font-bold uppercase tracking-[0.08em] text-homa-grey">
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        {...register}
        {...props}
        className={`w-full border-0 border-b-2 border-[#E0D8D8] bg-transparent px-0 py-2 font-body text-base text-homa-black transition-colors placeholder:text-homa-grey focus:border-homa-red focus:outline-none ${error ? 'border-homa-red' : ''} ${className}`}
      />
      {error && <p className="mt-1 font-body text-sm text-homa-red">{error}</p>}
    </div>
  );
}
