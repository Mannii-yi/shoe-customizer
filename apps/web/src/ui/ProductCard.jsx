/**
 * ProductCard (tinted card with shine; customizable shoes get an animated rainbow border).
 * Props: shoe {name, colour, swatch (hex), tint (CSS colour), fromPriceInr, tag, customizable}, index (0-based), selected (bool), onSelect,
 *        action {label, onClick?, to?, disabled?} (button shown ONLY on the selected card).
 * Display only: prices are whatever the data says (server prices apply in the customizer). */
import { Link } from 'react-router-dom';
import Badge from './Badge.jsx';
import Button from './Button.jsx';
import PriceTag from './PriceTag.jsx';
export default function ProductCard({ shoe, index, selected = false, onSelect, action }) {
  return (
    <div role="group" aria-label={shoe.name} onClick={onSelect} style={{ '--pc-bg': shoe.tint, background: shoe.tint }}
      className={`pc-shine ${shoe.customizable ? 'pc-rainbow' : ''} flex w-[224px] shrink-0 flex-col gap-1.5 rounded-lg border-2 p-4 shadow-card transition duration-500 ${selected ? 'scale-[1.04] border-ink opacity-100 shadow-lift' : 'scale-[.92] border-ink/15 opacity-90'}`}>
      <span aria-hidden="true" className="absolute right-4 top-3.5 text-[11px] font-bold tracking-[.16em] text-ink/45">0{index + 1}</span>
      <div className="mb-1 flex items-center gap-2.5">
        <span aria-hidden="true" className="h-[30px] w-[30px] rounded-full ring-[3px] ring-white/70" style={{ background: shoe.swatch }} />
        <span className="text-sm font-semibold">{shoe.colour}</span>
      </div>
      <Badge tone="ink" className="self-start">{shoe.tag}</Badge>
      <h3 className="mt-1 font-display text-3xl uppercase tracking-wide">
        <button type="button" onClick={onSelect} className="rounded text-left focus-visible:outline-none focus-visible:shadow-ring">{shoe.name}</button>
      </h3>
      <PriceTag amountInr={shoe.fromPriceInr} prefix={shoe.customizable ? 'from' : undefined} size="sm" />
      {selected && action && (
        <Button as={action.to ? Link : 'button'} to={action.to} onClick={action.onClick} disabled={action.disabled} variant={action.disabled ? 'outline' : 'primary'} size="sm" className="mt-2">{action.label}</Button>
      )}
    </div>
  );
}
