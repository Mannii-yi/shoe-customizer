/**
 * Collection (landing S6). Props: collRef.
 * A 3D ring of the shoes (Ring.jsx) turns with the selection. Cards slide so the selected one stays centred (arrows, click, Enter). Data comes from SHOES (landing/shoes.js).
 * The customizable shoe opens a drawer (starting colourway + link into /customize); others say "Coming soon".
 * No prices are computed here: the drawer shows the "from" price and the customizer shows server prices.
 */
import { Component, lazy, Suspense, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useShoeStore } from '../store/shoeStore.js';
import { Button, Container, Drawer, IconButton, PriceTag, ProductCard, SectionTitle, Swatch } from '../ui/index.js';
import { SHOES } from './shoes.js';
import { PALETTE, findColor } from './palette.js';
const CW = 224; const GAP = 18;
const Ring = lazy(() => import('./Ring.jsx'));
/** If WebGL or the model fails, show nothing: the cards below still work. */
class RingBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}
export default function Collection({ collRef }) {
  const [sel, setSel] = useState(0); const [open, setOpen] = useState(false); const [pick, setPick] = useState(0); const [w, setW] = useState(0);
  const clip = useRef(null); const catalog = useShoeStore((s) => s.catalog); const shoe = SHOES[sel];
  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => setW(clip.current.clientWidth)); ro.observe(clip.current); setW(clip.current.clientWidth);
    return () => ro.disconnect();
  }, []);
  const go = (d) => setSel((i) => (i + d + SHOES.length) % SHOES.length);
  const colours = PALETTE.map((p) => findColor(catalog, p.swatchColorId));
  return (
    <section ref={collRef} id="collection" aria-label="Collection" className="relative z-10 bg-bg py-[14vh]">
      <Container size="xl">
        <SectionTitle align="center" eyebrow="The collection" title="Pick a *pair.*" subtitle="Start from a pair you like. Make it yours in the customizer." />
        <div className="relative mt-6 h-[44vh] min-h-[280px]"><RingBoundary><Suspense fallback={null}><Ring selected={sel} /></Suspense></RingBoundary></div>
        <div className="mt-4 flex items-center gap-3">
          <IconButton label="Previous shoe" onClick={() => go(-1)}>‹</IconButton>
          <div ref={clip} className="flex-1 overflow-hidden py-8" style={{ maskImage: 'linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent)', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent)' }}>
            <div className="flex transition-transform duration-700 ease-out" style={{ gap: GAP, transform: `translateX(${w / 2 - (sel * (CW + GAP) + CW / 2)}px)` }}>
              {SHOES.map((s, i) => (
                <ProductCard key={s.id} shoe={s} index={i} selected={i === sel} onSelect={() => setSel(i)}
                  action={s.customizable ? { label: '✦ Customize', onClick: () => setOpen(true) } : { label: 'Coming soon', disabled: true }} />
              ))}
            </div>
          </div>
          <IconButton label="Next shoe" onClick={() => go(1)}>›</IconButton>
        </div>
        <div className="mt-10 text-center"><Button as={Link} to="/customize" size="lg">Start customizing</Button></div>
      </Container>
      <Drawer open={open && shoe.customizable} onClose={() => setOpen(false)} title={`Runner ${shoe.name}`}
        footer={<Button as={Link} to={`/customize?model=${shoe.id}&colorway=${PALETTE[pick].id}`} className="w-full" variant="accent">Open in customizer</Button>}>
        <p className="mb-5 leading-relaxed text-muted">Pick a starting colourway. You can change every part in the customizer, and the final price is calculated there.</p>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[.14em] text-muted">Starting colourway</p>
        <div className="flex flex-wrap gap-4">
          {PALETTE.map((p, i) => colours[i] && <Swatch key={p.id} color={colours[i].hex} label={colours[i].label} selected={pick === i} onClick={() => setPick(i)} />)}
        </div>
        <p className="mt-3 font-display text-2xl uppercase">{colours[pick]?.label}</p>
        <div className="mt-8 border-t border-line pt-5"><PriceTag amountInr={shoe.fromPriceInr} prefix="from" size="lg" /></div>
      </Drawer>
    </section>
  );
}
