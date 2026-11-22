/** PromoBar: black marquee fixed to the bottom of the screen (rendered by AppLayout). Props: items (string[]). Decorative loop; paused by reduced-motion CSS. */
const DEFAULT = ['Free shipping over ₹5,000', 'Made to order', '30-day returns', 'Pay on delivery', 'Ships in 14 days'];
export default function PromoBar({ items = DEFAULT }) {
  const row = Array.from({ length: 8 }, () => items).flat();
  return (
    <div aria-label="Store offers" role="region" className="fixed inset-x-0 bottom-0 z-40 overflow-hidden whitespace-nowrap bg-ink py-3 text-xs font-semibold uppercase tracking-[.12em] text-white">
      <div className="inline-block" style={{ animation: 'marquee 40s linear infinite' }}>
        {row.map((t, i) => <span key={i}>{t}<span aria-hidden="true" className="mx-5 text-lime">●</span></span>)}
      </div>
    </div>
  );
}
