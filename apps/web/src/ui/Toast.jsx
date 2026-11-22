/** Toast. Wrap the app once in <ToastProvider> (AppLayout already does). Anywhere below it:
 *   const toast = useToast(); toast.show({ type:'success'|'error'|'info'|'warning', title, message, duration=4000 });
 * Announced politely to screen readers. Each toast has a dismiss button. */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
const Ctx = createContext(null);
const TONE = { success: 'border-success', error: 'border-danger', info: 'border-blue', warning: 'border-coral' };
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]); const n = useRef(0);
  const dismiss = useCallback((id) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const show = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++n.current; setItems((l) => [...l, { id, type, title, message }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration); return id;
  }, [dismiss]);
  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-16 right-4 z-[70] flex w-[min(92vw,360px)] flex-col gap-3">
        {items.map((t) => (
          <div key={t.id} role="status" className={`pointer-events-auto flex items-start gap-3 rounded-md border-l-8 bg-surface p-4 shadow-lift ${TONE[t.type]}`}>
            <div className="flex-1">{t.title && <p className="font-bold">{t.title}</p>}{t.message && <p className="text-sm text-muted">{t.message}</p>}</div>
            <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(t.id)} className="rounded-full px-2 text-lg leading-none hover:bg-black/5 focus-visible:outline-none focus-visible:shadow-ring">×</button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useToast must be used inside <ToastProvider> (AppLayout provides it)');
  return c;
}
