/**
 * Button component — supports primary, secondary, ghost variants and sizes.
 *
 * Usage:
 *   <Button variant="primary" size="lg" onClick={...}>Start Demo</Button>
 *   <Button variant="secondary" disabled>Cancel</Button>
 *   <Button variant="primary" loading>Saving…</Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const base = 'btn';
  const variantClass = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    ghost:     'btn-ghost',
  }[variant] ?? 'btn-primary';

  const sizeClass = size === 'lg' ? 'btn-lg' : '';

  const isDisabled = disabled || loading;

  return (
    <button
      className={`${base} ${variantClass} ${sizeClass} ${className} ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
