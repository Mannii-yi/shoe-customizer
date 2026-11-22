/** PriceTag. Props: amountInr (INTEGER rupees), prefix (e.g. "from"), strikeInr (old price), delta (bool: show +₹ for option deltas), size 'sm'|'md'|'lg'.
 * Display only. NEVER add prices on the client; show numbers the server returned. */
export const formatInr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const S = { sm: 'text-sm', md: 'text-xl', lg: 'text-4xl' };
export default function PriceTag({ amountInr, prefix, strikeInr, delta = false, size = 'md', className = '' }) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      {prefix && <span className="text-xs font-semibold text-muted">{prefix}</span>}
      <span className={`${size === 'sm' ? 'font-semibold' : 'font-display'} ${S[size]}`}>{delta && amountInr > 0 ? '+' : ''}{formatInr(amountInr)}</span>
      {strikeInr != null && <s className="text-sm text-muted">{formatInr(strikeInr)}</s>}
    </span>
  );
}
