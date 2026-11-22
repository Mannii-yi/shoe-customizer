/** Tooltip. Props: label (text), children (ONE focusable element), side 'top'|'bottom' (default top). Shows on hover AND keyboard focus. */
import { cloneElement, useId, useState } from 'react';
export default function Tooltip({ label, children, side = 'top' }) {
  const id = useId(); const [o, setO] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setO(true)} onMouseLeave={() => setO(false)} onFocus={() => setO(true)} onBlur={() => setO(false)}>
      {cloneElement(children, { 'aria-describedby': o ? id : undefined })}
      {o && <span role="tooltip" id={id} className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-sm bg-ink px-3 py-1.5 text-xs font-semibold text-white ${side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}>{label}</span>}
    </span>
  );
}
