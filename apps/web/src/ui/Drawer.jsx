/** Drawer (side sheet). Props: open, onClose, title, children, footer. Same behaviour as Modal: portal, ESC/backdrop close, focus trap + restore, scroll lock. */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
const FOCUS = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
export default function Drawer({ open, onClose, title, children, footer }) {
  const box = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement; const ov = document.body.style.overflow; document.body.style.overflow = 'hidden';
    (box.current.querySelector(FOCUS) || box.current).focus();
    const key = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key !== 'Tab') return;
      const f = [...box.current.querySelectorAll(FOCUS)]; if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = ov; prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] bg-ink/40" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <aside ref={box} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        className="absolute bottom-16 right-4 top-20 flex w-[min(92vw,380px)] flex-col overflow-auto rounded-lg bg-surface p-6 shadow-lift focus:outline-none" style={{ animation: 'drawerIn .5s var(--ease-out)' }}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-4xl uppercase leading-none">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/5 hover:bg-black/10 focus-visible:outline-none focus-visible:shadow-ring">✕</button>
        </div>
        <div className="flex-1">{children}</div>
        {footer && <div className="mt-6">{footer}</div>}
      </aside>
    </div>, document.body);
}
