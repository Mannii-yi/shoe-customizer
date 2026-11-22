/** LandingStage: the fixed full-viewport stage behind the scrolling text. Props: stageRef, bigWordVisible (bool), poster (bool: show fallback instead of the scene), sceneOn (bool: false unmounts the scene once the collection covers it, saving GPU).
 * Layers: Backdrop (glow) -> giant RUNNER word -> <ShoeScene variant="hero"/> (lazy) -> scrim. Scene is only reachable through the store. */
import { lazy, Suspense } from 'react';
import Backdrop from './Backdrop.jsx';
const ShoeScene = lazy(() => import('../three/index.js').then((m) => ({ default: m.ShoeScene })));
export default function LandingStage({ stageRef, bigWordVisible = true, poster = false, sceneOn = true }) {
  return (
    <div ref={stageRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Backdrop />
      <div className={`absolute inset-x-0 top-[31%] -translate-y-1/2 text-center font-display text-[clamp(100px,22vw,330px)] leading-[.9] text-coral transition-opacity duration-500 ${bigWordVisible ? 'opacity-100' : 'opacity-0'}`}>RUNNER</div>
      <div className="absolute inset-0">
        {poster || !sceneOn ? <div className="grid h-full place-items-center text-muted">{/* MOCK: replace with public/brand/poster.webp */}3D preview unavailable</div>
          : <Suspense fallback={null}><ShoeScene variant="hero" quality="auto" /></Suspense>}
      </div>
    </div>
  );
}
