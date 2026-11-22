/** Badge. Props: tone 'lime'|'ink'|'coral'|'blue'|'neutral' (default lime), children. */
const T = { lime: 'bg-lime text-ink', ink: 'bg-ink text-lime', coral: 'bg-coral text-ink', blue: 'bg-blue text-white', neutral: 'bg-black/10 text-ink' };
export default function Badge({ tone = 'lime', className = '', children }) {
  return <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[.12em] ${T[tone]} ${className}`}>{children}</span>;
}
