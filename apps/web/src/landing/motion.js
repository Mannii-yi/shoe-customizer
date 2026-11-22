/**
 * motion.js (Dev B). Landing scroll engine.
 * ONE GSAP timeline, scrubbed by scroll, tweens a proxy {e} and writes it to the scene store via setExplode (the store is the only bridge).
 * Presets, auto-rotate and colourways are chosen from the timeline PROGRESS by an idempotent lookup, so scrolling backwards
 * always restores the right state (tl.call() would not re-fire in reverse). Only PUBLIC store actions are called.
 */
import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useShoeStore } from '../store/shoeStore.js';
gsap.registerPlugin(ScrollTrigger);

/** Scene table over timeline progress 0..1 (5 screens: S1..S5). */
export const SCENES = [
  { id: 'hero', at: 0, preset: 'hero', autoRotate: true, swirl: false },
  { id: 'parts', at: 0.2, preset: 'three-quarter', autoRotate: false, swirl: false },
  { id: 'anatomy', at: 0.4, preset: 'exploded-wide', autoRotate: false, swirl: true },
  { id: 'underfoot', at: 0.6, preset: 'sole', autoRotate: false, swirl: false },
  { id: 'yours', at: 0.8, preset: 'three-quarter', autoRotate: false, swirl: false },
];
import { PALETTE } from './palette.js';
let base = -1; // palette index chosen by the hero picker (-1 = catalog default)

export const sceneAt = (p) => SCENES.reduce((acc, s, i) => (p >= s.at ? i : acc), 0);
export const colorwayAt = (p) => (p < 0.8 ? 0 : (() => { const f = (p - 0.8) / 0.2; return f < 0.25 ? 0 : f < 0.5 ? 1 : f < 0.75 ? 2 : 3; })());

function applyScene(i) {
  const s = SCENES[i]; const st = useShoeStore.getState();
  st.setCameraPreset(s.preset); st.setAutoRotate(s.autoRotate); st.setSwirlEnabled(s.swirl);
}
function applyPalette(i) {
  const st = useShoeStore.getState();
  st.resetConfiguration();
  Object.entries(PALETTE[i].parts).forEach(([k, o]) => st.setPartOption(k, o));
}
/** Colourway index: 0 = the visitor's base choice, 1..3 = PALETTE[0..2] cycled in "Make it yours". */
function applyColorway(i) {
  if (i === 0) { if (base < 0) useShoeStore.getState().resetConfiguration(); else applyPalette(base); return; }
  applyPalette(i - 1);
}
let currentCw = 0;
/** Hero picker: choose a base colourway (palette index). Applies now unless the "Make it yours" cycle is running. */
export function chooseBase(i) { base = i; if (currentCw === 0) applyColorway(0); }
/**
 * Create the master timeline. @param {{trigger: HTMLElement, onScene?: (i:number)=>void}} opts
 * @returns {() => void} cleanup (kills triggers and restores the store).
 */
export function createMasterTimeline({ trigger, onScene }) {
  const st = useShoeStore.getState(); const prev = { swirl: st.swirlEnabled, auto: st.autoRotate, preset: st.cameraPreset }; // preset restored as 'hero' per the scene contract (section 9)
  const proxy = { e: 0 }; let scene = -1; let cw = -1;
  const tl = gsap.timeline({ defaults: { ease: 'none' }, onUpdate: () => {
    useShoeStore.getState().setExplode(proxy.e);
    const p = tl.progress(); const si = sceneAt(p); const ci = colorwayAt(p);
    if (si !== scene) { scene = si; applyScene(si); onScene?.(si); }
    if (ci !== cw) { cw = ci; currentCw = ci; applyColorway(ci); }
  } });
  tl.to(proxy, { e: 0.5, duration: 0.2 }, 0.2).to(proxy, { e: 1, duration: 0.2 }, 0.4).to(proxy, { e: 0, duration: 0.2 }, 0.8);
  const trig = ScrollTrigger.create({ trigger, start: 'top top', end: 'bottom top', scrub: 1, animation: tl });
  applyScene(0);
  return () => {
    trig.kill(); tl.kill();
    const s = useShoeStore.getState();
    s.setExplode(0); s.setCameraPreset('hero'); s.setAutoRotate(prev.auto); s.setSwirlEnabled(prev.swirl); s.resetConfiguration(); base = -1; currentCw = 0;
  };
}

/** @returns {boolean} true when the user prefers reduced motion. */
export function usePrefersReducedMotion() {
  const q = '(prefers-reduced-motion: reduce)';
  const [r, setR] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(q).matches : false));
  useEffect(() => { const m = window.matchMedia(q); const f = () => setR(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f); }, []);
  return r;
}
