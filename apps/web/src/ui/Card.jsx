/** Card. Props: variant 'plain'|'tinted'|'glass' (default plain), tint (CSS color, for tinted), selected (bool), interactive (bool: hover lift + pointer),
 *        as (default 'div'), ...rest. */
export default function Card({ variant = 'plain', tint, selected = false, interactive = false, as = 'div', className = '', style, children, ...rest }) {
  const As = as;
  const v = { plain: 'bg-surface', tinted: '', glass: 'bg-white/60 backdrop-blur-md' }[variant];
  return (
    <As {...rest} style={{ ...(variant === 'tinted' ? { background: tint } : null), ...style }}
      className={`rounded-lg border-2 p-5 shadow-card transition duration-300 ${v} ${selected ? 'border-ink shadow-lift scale-[1.03]' : 'border-ink/15'} ${interactive ? 'cursor-pointer hover:-translate-y-1.5 focus-visible:outline-none focus-visible:shadow-ring' : ''} ${className}`}>
      {children}
    </As>
  );
}
