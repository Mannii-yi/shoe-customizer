/** Callouts: four fixed-position labels shown during the anatomy scene. Props: visible (bool). Fixed screen coordinates by design (no 3D projection),
 * so they are decorative and aria-hidden. Kept clear of the left-aligned scene text; re-tune against the real model. Hidden on small screens. */
const L = [['Laces', 'left-[34vw] top-[22vh]'], ['Upper', 'right-[14vw] top-[28vh]'], ['Midsole', 'right-[10vw] top-[52vh]'], ['Outsole', 'right-[24vw] top-[66vh]']];
export default function Callouts({ visible }) {
  return L.map(([t, pos]) => (
    <span key={t} aria-hidden="true" className={`pointer-events-none fixed z-20 hidden rounded-full border-2 border-ink bg-surface/80 px-4 py-1.5 text-sm font-bold backdrop-blur transition-opacity duration-300 md:block ${pos} ${visible ? 'opacity-100' : 'opacity-0'}`}>{t}</span>
  ));
}
