/** Skeleton (loading placeholder). Props: width, height (CSS values), rounded (default 'rounded-md'). Decorative: aria-hidden. */
export default function Skeleton({ width = '100%', height = 16, rounded = 'rounded-md', className = '' }) {
  return <div aria-hidden="true" className={`${rounded} ${className}`} style={{ width, height, background: 'linear-gradient(90deg,#e7dfd3 25%,#f3ece2 50%,#e7dfd3 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s linear infinite' }} />;
}
