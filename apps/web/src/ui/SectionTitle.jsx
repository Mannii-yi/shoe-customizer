/** SectionTitle. Props: eyebrow (small lime tag), title (string; wrap the word to colour in *stars*, e.g. "Pick a *pair.*"), subtitle, align 'left'|'center'|'right', as heading tag (default h2). */
import Badge from './Badge.jsx';
export default function SectionTitle({ eyebrow, title, subtitle, align = 'left', as = 'h2', className = '' }) {
  const As = as;
  const parts = String(title).split(/\*(.+?)\*/g);
  const a = { left: '', center: 'text-center items-center', right: 'text-right items-end' }[align];
  return (
    <div className={`flex flex-col gap-4 ${a} ${className}`}>
      {eyebrow && <Badge>{eyebrow}</Badge>}
      <As className="font-display text-[clamp(40px,7vw,96px)] uppercase leading-[1.04]">{parts.map((p, i) => (i % 2 ? <span key={i} className="text-coral">{p}</span> : p))}</As>
      {subtitle && <p className="max-w-[44ch] leading-relaxed text-muted">{subtitle}</p>}
    </div>
  );
}
