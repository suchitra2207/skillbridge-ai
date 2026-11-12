/**
 * Badge — small pill label.
 *
 * variant: 'green' | 'amber' | 'gray' | 'demo'
 */
export function Badge({ variant = 'gray', className = '', children }) {
  const cls = {
    green: 'badge-green',
    amber: 'badge-amber',
    gray:  'badge-gray',
    demo:  'badge-demo',
  }[variant] ?? 'badge-gray';

  return <span className={`${cls} ${className}`}>{children}</span>;
}
