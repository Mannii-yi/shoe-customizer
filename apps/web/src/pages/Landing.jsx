/**
 * Landing page (default export). Dev D registers it at "/" (wrap with <AppLayout flush>).
 * Flow: Preloader -> fixed stage (Backdrop + ShoeScene) -> 5 scroll scenes driven by ONE GSAP timeline -> collection + CTA to /customize.
 * No API calls. Reduced motion: no Lenis, no scrub; a static assembled shoe and stacked text.
 */
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useShoeStore } from '../store/shoeStore.js';
import catalogSeed from '../landing/catalogSeed.js';
import LenisProvider from '../landing/LenisProvider.jsx';
import LandingStage from '../landing/LandingStage.jsx';
import Preloader from '../landing/Preloader.jsx';
import Callouts from '../landing/Callouts.jsx';
import Scenes from '../landing/Scenes.jsx';
import Collection from '../landing/Collection.jsx';
import InfoSections from '../landing/InfoSections.jsx';
import { createMasterTimeline, usePrefersReducedMotion } from '../landing/motion.js';

export default function Landing() {
  const reduce = usePrefersReducedMotion();
  const track = useRef(null); const coll = useRef(null); const stage = useRef(null);
  const [scene, setScene] = useState(0); const [poster, setPoster] = useState(false); const [sceneOn, setSceneOn] = useState(true);
  const timedOut = useCallback(() => { if (!useShoeStore.getState().isModelReady) setPoster(true); }, []);

  useLayoutEffect(() => {
    const st = useShoeStore.getState();
    if (!st.catalog) st.setCatalog(catalogSeed);
    if (reduce) { st.setExplode(0); st.setCameraPreset('hero'); st.setAutoRotate(false); return undefined; }
    const cleanup = createMasterTimeline({ trigger: track.current, onScene: setScene });
    // Scene on/off is derived from scroll position only (no tween callbacks), so fast scrolling back and forth cannot leave it unmounted.
    let past = null;
    const sync = (self) => {
      const now = self.progress > 0; if (now === past) return; past = now;
      if (!now) setSceneOn(true);
      gsap.to(stage.current, { autoAlpha: now ? 0 : 1, duration: 0.5, overwrite: true, onComplete: () => { if (now) setSceneOn(false); } });
    };
    const fade = ScrollTrigger.create({ trigger: coll.current, start: 'top 80%', end: 'top 79%', onUpdate: sync, onRefresh: sync });
    return () => { fade.kill(); cleanup(); };
  }, [reduce]);

  if (reduce) {
    return (
      <>
        <div className="relative h-[70vh]"><LandingStage stageRef={stage} bigWordVisible poster={poster} /></div>
        <Scenes /><Collection collRef={coll} /><InfoSections />
      </>
    );
  }
  return (
    <LenisProvider enabled>
      <Preloader onTimeout={timedOut} />
      <LandingStage stageRef={stage} bigWordVisible={scene === 0} poster={poster} sceneOn={sceneOn} />
      <Callouts visible={scene === 2} />
      <div ref={track}><Scenes /></div>
      <Collection collRef={coll} />
      <InfoSections />
    </LenisProvider>
  );
}
