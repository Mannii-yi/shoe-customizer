/**
 * Backdrop.jsx (Dev B). Code-only light backdrop for the landing stage (layer 1, behind <ShoeScene variant="hero"/>).
 * Props: glowRef (optional ref to the glow element so the master timeline can animate it), className.
 * Decorative: aria-hidden, ignores pointer events. The shelves are a blurred drawn illustration, not a photo.
 */
import './Backdrop.css';
const BOX = [['#ffa8d4', [60, 150, 110, 60], [520, 370, 120, 60], [900, 590, 130, 60]], ['#c8f23c', [200, 160, 90, 50], [700, 380, 100, 50], [330, 600, 110, 50]],
  ['#2b50ff', [330, 150, 100, 60], [120, 375, 110, 55], [640, 590, 120, 60]], ['#ff5a3c', [790, 152, 120, 58], [330, 372, 100, 58], [60, 595, 120, 55]]];
const BLOBS = [['40vw', 'left:-8vw;top:6vh', '#ffa8d4', 0], ['36vw', 'right:-6vw;top:30vh', '#c8f23c', -5], ['34vw', 'left:30vw;bottom:-10vh', '#9db2ff', -9]];
const css = (s) => Object.fromEntries(s.split(';').map((x) => x.split(':')));
/** @param {{ glowRef?: import('react').RefObject<HTMLDivElement>, className?: string }} props */
export default function Backdrop({ glowRef, className = '' }) {
  return (
    <div className={`backdrop ${className}`.trim()} aria-hidden="true">
      {BLOBS.map(([w, pos, c, d]) => <div key={c} className="backdrop__blob" style={{ width: w, height: w, background: c, animationDelay: `${d}s`, ...css(pos) }} />)}
      <svg className="backdrop__shelves" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs><filter id="bdBlur"><feGaussianBlur stdDeviation="7" /></filter></defs>
        <g filter="url(#bdBlur)">
          {[210, 430, 650].map((y) => <rect key={y} x="0" y={y} width="1200" height="14" fill="#c9b9a3" />)}
          {BOX.flatMap(([c, ...r]) => r.map((b, i) => <rect key={c + i} x={b[0]} y={b[1]} width={b[2]} height={b[3]} rx="8" fill={c} />))}
          {[[220, 60, 34], [600, 50, 40], [980, 64, 34]].map(([x, y, r]) => <circle key={x} cx={x} cy={y} r={r} fill="#fff3c9" />)}
        </g>
      </svg>
      <div className="backdrop__wash" />
      <div className="backdrop__glow" ref={glowRef} />
      <div className="backdrop__grain" />
    </div>
  );
}
