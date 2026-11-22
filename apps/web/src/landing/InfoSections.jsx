/** InfoSections: "Our story" (animated counters), "How it works", and reviews. Props: none.
 * MOCK: every number, quote and name here is placeholder copy for the demo store. Edit the arrays below. */
import { useEffect, useRef, useState } from 'react';
import { Badge, Container, SectionTitle } from '../ui/index.js';
const STATS = [[12000, 'pairs made to order'], [14, 'days to your door'], [30, 'day free returns'], [48, 'colours and finishes']];
const STEPS = [['01', 'Pick a pair', 'Browse the collection and spin each shoe in 3D.', '#ffa8d4', ''], ['02', 'Make it yours', 'Choose colours and finish. The price updates as you go.', '#c8f23c', ''],
  ['03', 'We build it', 'Our workshop makes your pair to order and checks every one.', '#9db2ff', ''], ['04', 'Delivered', 'Free shipping over ₹5,000, with 30 days to return it.', '#ff5a3c', '']];
const REVIEWS = [['“The Midnight pair looks even better in person. I get asked about them daily.”', 'Aarav, Delhi'], ['“Loved choosing my own colours. Arrived in 12 days and fit perfectly.”', 'Meera, Pune'], ['“Comfortable from day one. Great store, easy returns.”', 'Kabir, Bengaluru']];
/** Fades children in when scrolled into view. Returns a ref callback. */
function useReveal() {
  const io = useRef(null);
  useEffect(() => { io.current = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.current.unobserve(e.target); } }), { threshold: 0.2 }); return () => io.current.disconnect(); }, []);
  return (el) => { if (el && io.current) io.current.observe(el); };
}
function Counter({ to }) {
  const [n, setN] = useState(0); const ref = useRef(null);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; o.disconnect(); const t0 = performance.now();
      const f = (t) => { const p = Math.min(1, (t - t0) / 1400); setN(Math.round(to * (1 - (1 - p) ** 3))); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f);
    }, { threshold: 0.4 }); o.observe(ref.current); return () => o.disconnect();
  }, [to]);
  return <span ref={ref}>{n.toLocaleString('en-IN')}</span>;
}
export default function InfoSections() {
  const rv = useReveal();
  return (
    <>
      <section id="story" aria-label="Our story" className="relative z-10 bg-bg py-[14vh]"><Container size="xl">
        <div ref={rv} className="rvl"><SectionTitle eyebrow="Our story" title="Small studio. *Big* on detail." /></div>
        <p ref={rv} className="rvl mt-8 max-w-[56ch] text-lg leading-relaxed text-muted">We started Runner because buying sneakers felt like picking from a shelf of someone else’s decisions. So we build every pair to order: you choose the colours and finish, our workshop makes it, and it ships to your door in about two weeks.</p>
        <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-5">
          {STATS.map(([n, l]) => <div key={l} ref={rv} className="rvl rounded-lg bg-surface p-7"><b className="block font-display text-6xl text-blue"><Counter to={n} /></b><span className="text-sm text-muted">{l}</span></div>)}
        </div>
      </Container></section>
      <section id="how" aria-label="How it works" className="relative z-10 bg-[#fff7ec] py-[14vh]"><Container size="xl">
        <div ref={rv} className="rvl"><SectionTitle title="How it *works*" /></div>
        <ol className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-5">
          {STEPS.map(([n, t, d, bg], i) => (
            <li key={n} ref={rv} className="rvl min-h-[230px] rounded-lg p-8 text-ink transition duration-300 hover:-translate-y-2 hover:-rotate-1" style={{ background: bg }}>
              <b aria-hidden="true" className="block font-display text-6xl opacity-40">{n}</b><h3 className="mb-2 mt-1 font-display text-3xl uppercase">{t}</h3><p className="leading-relaxed">{d}</p>
              {i === 3 && <Badge tone="ink" className="mt-4">Demo store</Badge>}
            </li>))}
        </ol>
      </Container></section>
      <section id="reviews" aria-label="Reviews" className="relative z-10 bg-bg py-[14vh]"><Container size="xl">
        <div ref={rv} className="rvl"><SectionTitle title="People *love* them" /></div>
        <ul className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5">
          {REVIEWS.map(([q, w]) => <li key={w} ref={rv} className="rvl rounded-lg bg-surface p-7 leading-relaxed">{q}<em className="mt-3 block text-sm font-semibold not-italic text-coral">{w}</em></li>)}
        </ul>
      </Container></section>
    </>
  );
}
