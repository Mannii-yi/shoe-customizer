/** Preloader (light theme). Props: onTimeout (called after 8 s if the model still is not ready, so the page can show the poster fallback).
 * Waits for useShoeStore.isModelReady AND 1.7 s minimum; progress eases to 88% then completes when ready. Slides up when done. No drei import (keeps 3D out of the main bundle). */
import { useEffect, useState } from 'react';
import { useShoeStore } from '../store/shoeStore.js';
const MSG = ['Lacing up your shoes…', 'Mixing the colours…', 'Polishing the soles…', 'Almost there…'];
const TICKER = 'MADE TO ORDER ★ 48 COLOURS ★ FREE SHIPPING ★ '.repeat(8);
export default function Preloader({ onTimeout }) {
  const [p, setP] = useState(0); const [out, setOut] = useState(false); const [gone, setGone] = useState(false);
  useEffect(() => {
    const t0 = performance.now(); let raf; let cur = 0; let timed = false;
    const tick = () => {
      const el = performance.now() - t0; timed = timed || el > 8000;
      const done = (useShoeStore.getState().isModelReady && el > 1700) || timed;
      cur += ((done ? 100 : Math.min(88, el / 22)) - cur) * 0.07; setP(cur);
      if (cur > 99.3) { if (timed && !useShoeStore.getState().isModelReady) onTimeout?.(); setOut(true); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [onTimeout]);
  useEffect(() => { if (!out) return undefined; const t = setTimeout(() => setGone(true), 950); return () => clearTimeout(t); }, [out]);
  if (gone) return null;
  const blob = 'absolute rounded-full opacity-55 blur-[70px]';
  return (
    <div role="status" aria-label="Loading" className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-5 overflow-hidden bg-coral transition-transform duration-[900ms] ease-out" style={{ transform: out ? 'translateY(-100%)' : 'none' }}>
      <div aria-hidden="true" className={blob} style={{ width: '46vw', height: '46vw', left: '-10vw', top: '-12vw', background: '#ffa8d4', animation: 'blobFloat 9s ease-in-out infinite alternate' }} />
      <div aria-hidden="true" className={blob} style={{ width: '40vw', height: '40vw', right: '-8vw', bottom: '-6vw', background: '#c8f23c', animation: 'blobFloat 9s ease-in-out infinite alternate' }} />
      <div aria-hidden="true" className={blob} style={{ width: '30vw', height: '30vw', right: '18vw', top: '-8vw', background: '#2b50ff', animation: 'blobFloat 9s ease-in-out infinite alternate' }} />
      <div className="relative font-display text-[clamp(80px,20vw,260px)] leading-[.9]">
        <span className="text-white/30">RUNNER</span>
        <span aria-hidden="true" className="absolute inset-0 text-white" style={{ clipPath: `inset(${100 - p}% 0 0 0)` }}>RUNNER</span>
      </div>
      <div className="relative h-1.5 w-[min(70vw,520px)] overflow-hidden rounded-full bg-white/35"><i className="block h-full rounded-full bg-lime" style={{ width: `${p}%` }} /></div>
      <div className="relative flex w-[min(70vw,520px)] justify-between text-sm font-semibold text-white"><span>{MSG[Math.min(3, Math.floor(p / 26))]}</span><span>{Math.round(p)}%</span></div>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 overflow-hidden whitespace-nowrap bg-ink py-3.5 text-xs font-semibold tracking-[.16em] text-white"><div className="inline-block" style={{ animation: 'marquee 26s linear infinite' }}>{TICKER}</div></div>
    </div>
  );
}
