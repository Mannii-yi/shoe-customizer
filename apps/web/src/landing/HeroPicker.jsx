/** HeroPicker: glass panel on the right of the hero. Tap a colour to recolour the hero shoe through the store (setPartOption via motion.chooseBase).
 * Swatch colours and names come from the catalog, so they always match the real shoe. Hidden below md. */
import { useState } from 'react';
import { useShoeStore } from '../store/shoeStore.js';
import { Swatch } from '../ui/index.js';
import { PALETTE, findColor } from './palette.js';
import { chooseBase } from './motion.js';
export default function HeroPicker() {
  const catalog = useShoeStore((s) => s.catalog); const [on, setOn] = useState(-1);
  const colours = PALETTE.map((p) => findColor(catalog, p.swatchColorId));
  return (
    <div className="absolute right-[6vw] top-1/2 hidden -translate-y-1/2 flex-col gap-3.5 rounded-lg border border-white bg-white/60 p-6 shadow-lift backdrop-blur-md md:flex">
      <span className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Try a colour</span>
      <div className="flex gap-3.5">
        {PALETTE.map((p, i) => colours[i] && <Swatch key={p.id} color={colours[i].hex} label={colours[i].label} selected={on === i} size={38} onClick={() => { setOn(i); chooseBase(i); }} />)}
      </div>
      <b className="font-display text-3xl uppercase leading-none">{on >= 0 ? colours[on]?.label : 'Original'}</b>
      <small className="text-xs text-muted">Tap a colour to see it on the shoe</small>
    </div>
  );
}
