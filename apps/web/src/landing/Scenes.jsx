/** Scenes: the five 100vh text sections (S1..S5) that scroll over the fixed stage. Props: none. Copy is editable here. */
import { Link } from 'react-router-dom';
import { Badge, Button } from '../ui/index.js';
import HeroPicker from './HeroPicker.jsx';
const S = [
  { tag: 'New season', title: 'Your shoes. *Your* colors.', body: 'Runner is a small sneaker studio. Pick a pair, make it yours, and we build it for you.', cue: 'Scroll to take it apart' },
  { tag: 'Ten parts', title: 'Ten parts. *One* pair.', body: 'Every panel, lace and layer is its own piece, and every piece is yours to change.', right: true },
  { tag: 'Anatomy', title: 'The anatomy of a *sneaker.*', body: 'Upper, laces, midsole, outsole: see how it all fits before you choose.' },
  { tag: 'Underfoot', title: 'Everything *underfoot.*', body: 'Comfort starts at the sole. Pick the rubber, foam and finish.', right: true },
  { tag: 'Make it yours', title: 'Make it *yours.*', body: 'The parts snap back together in your colors.' },
];
const render = (t) => t.split(/\*(.+?)\*/g).map((p, i) => (i % 2 ? <span key={i} className="text-coral">{p}</span> : p));
export default function Scenes() {
  return S.map((s, i) => (
    <section key={s.tag} className={`relative z-10 flex h-screen items-end px-[5vw] pb-[14vh] ${s.right ? 'justify-end text-right' : ''}`}>
      <div className="max-w-[560px]">
        <Badge>{s.tag}</Badge>
        {i === 0 ? <h1 className="mt-5 font-display text-[clamp(44px,6.2vw,92px)] uppercase leading-[1.04]">{render(s.title)}</h1>
          : <h2 className="mt-5 font-display text-[clamp(40px,6vw,88px)] uppercase leading-[1.04]">{render(s.title)}</h2>}
        <p className={`mt-5 max-w-[38ch] leading-relaxed text-muted ${s.right ? 'ml-auto' : ''}`}>{s.body}</p>
        {i === 0 && <div className="mt-8 flex flex-wrap gap-3"><Button as="a" href="#collection">Shop now</Button><Button as={Link} to="/customize" variant="outline">Customize yours</Button></div>}
        {s.cue && <p className="mt-8 text-xs font-bold uppercase tracking-[.14em]">{s.cue} ↓</p>}
      </div>
      {i === 0 && <HeroPicker />}
    </section>
  ));
}
