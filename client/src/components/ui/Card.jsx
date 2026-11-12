/**
 * Card — standard surface container.
 *
 * Usage:
 *   <Card>content</Card>
 *   <Card className="p-8">wider padding</Card>
 */
export function Card({ className = '', children, ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}
