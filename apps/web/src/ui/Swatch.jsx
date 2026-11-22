/** Swatch (colour picker dot). Props: color (hex, from catalog), label (colour name, REQUIRED for a11y), selected, onClick, priceDeltaInr (optional "+₹150"), size px (default 40). */
import PriceTag from './PriceTag.jsx';
export default function Swatch({ color, label, selected = false, onClick, priceDeltaInr = 0, size = 40 }) {
  return (
    <button type="button" aria-label={label} aria-pressed={selected} title={label} onClick={onClick}
      className="group relative inline-flex flex-col items-center gap-1 focus-visible:outline-none">
      <span style={{ width: size, height: size, background: color }}
        className={`rounded-full border-[3px] border-white transition duration-200 group-hover:scale-110 group-focus-visible:shadow-ring ${selected ? 'ring-[3px] ring-ink' : 'ring-[1.5px] ring-ink/25'}`} />
      {priceDeltaInr > 0 && <span className="text-[11px] font-semibold text-muted"><PriceTag amountInr={priceDeltaInr} delta size="sm" /></span>}
    </button>
  );
}
