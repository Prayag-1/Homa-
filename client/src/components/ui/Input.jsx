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
      {label && <label htmlFor={name} className="block text-sm font-medium mb-2">{label}</label>}
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        {...register}
        {...props}
        className={`w-full px-0 py-2 border-0 border-b-2 border-black focus:outline-none focus:border-red-500 transition-colors bg-transparent ${error ? 'border-red-500' : ''} ${className}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
