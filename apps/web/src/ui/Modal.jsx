/** Modal. Props: open (bool), onClose, title (string, also aria-label), children, footer (node).
 * Behaviour: portal to body, ESC closes, click backdrop closes, focus moves inside and returns on close, Tab is trapped, body scroll locked. */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
const FOCUS = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
export default function Modal({ open, onClose, title, children, footer }) {
  const box = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement; const prevOv = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (box.current.querySelector(FOCUS) || box.current).focus();
    const key = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key !== 'Tab') return;
      const f = [...box.current.querySelectorAll(FOCUS)]; if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = prevOv; prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/50 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="w-full max-w-md rounded-lg bg-surface p-6 shadow-lift focus:outline-none">
        <h2 className="mb-4 font-display text-3xl uppercase">{title}</h2>
        <div>{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>, document.body);
}
