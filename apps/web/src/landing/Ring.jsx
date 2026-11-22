/**
 * Ring (landing collection): the shoes from SHOES orbit on a ring in their OWN canvas (no change to Dev A's scene).
 * Props: selected (index into SHOES). The ring turns so the selected shoe is at the front, with a soft glow behind it.
 * Models: SHOES[i].file, or the Runner model (VITE_MODEL_URL, default /models/runner.glb) recoloured by the entry's colourway.
 * Decorative (aria-hidden): the cards carry the real information. Renders only while on screen (frameloop 'never' otherwise).
 * Part names (part_upper ...) come from the contract's parts.json, so the recolour works on Dev A's model.
 * Draco: Dev A's ShoeModel sets the shared decoder path ('/draco/') once at load (useGLTF.setDecoderPath is global), so this ring needs no extra call.
 */
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useShoeStore } from '../store/shoeStore.js';
import { PALETTE, findColor } from './palette.js';
import { SHOES } from './shoes.js';
const MODEL = import.meta.env.VITE_MODEL_URL || '/models/runner.glb';
const R = 2.7; const STEP = (Math.PI * 2) / SHOES.length;

function RingShoe({ shoe, index, catalog, group }) {
  const { scene } = useGLTF(shoe.file || MODEL);
  const obj = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => { if (o.isMesh) o.material = o.material.clone(); });
    const pal = shoe.recolor === false ? null : PALETTE.find((p) => p.id === shoe.colourway);
    if (pal) {
      c.traverse((o) => {
        if (!o.name?.startsWith('part_')) return;
        const col = pal.parts[o.name.slice(5)]; const hex = col && findColor(catalog, col.colorId)?.hex;
        if (hex) o.traverse((m) => { if (m.isMesh) m.material.color.set(hex); });
      });
    }
    const box = new THREE.Box3().setFromObject(c); const sz = box.getSize(new THREE.Vector3()); const ct = box.getCenter(new THREE.Vector3());
    const k = 2.6 / Math.max(sz.x, sz.y, sz.z); c.scale.setScalar(k); c.position.copy(ct.multiplyScalar(-k));
    const w = new THREE.Group(); w.add(c); return w;
  }, [scene, shoe, catalog]);
  const a = index * STEP;
  useFrame((s) => { obj.rotation.y = 0.5 - group.current.rotation.y + s.clock.elapsedTime * 0.35 + index; });
  return <primitive object={obj} position={[Math.sin(a) * R, 0, Math.cos(a) * R]} scale={0.66} />;
}

function Glow({ selected, catalog }) {
  const ref = useRef(null);
  const tex = useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d');
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(cv);
  }, []);
  const target = useMemo(() => {
    const pal = PALETTE.find((p) => p.id === SHOES[selected].colourway); const hex = pal && findColor(catalog, pal.swatchColorId)?.hex;
    return new THREE.Color(hex || '#ffd596');
  }, [selected, catalog]);
  useFrame(() => { if (ref.current) { ref.current.material.color.lerp(target, 0.08); ref.current.material.opacity = 0.8 + 0.1 * Math.sin(performance.now() / 600); } });
  return <sprite ref={ref} position={[0, 0.2, -3.5]} scale={[8.5, 8.5, 1]}><spriteMaterial map={tex} color="#ffd596" transparent depthWrite={false} opacity={0.8} /></sprite>;
}

function Scene({ selected }) {
  const catalog = useShoeStore((s) => s.catalog); const group = useRef(null);
  useFrame(() => { if (group.current) group.current.rotation.y += (-selected * STEP - group.current.rotation.y) * 0.07; });
  return (
    <>
      <hemisphereLight args={['#ffffff', '#c9b9a3', 1.4]} />
      <directionalLight position={[3, 5, 4]} intensity={2.4} />
      <directionalLight position={[-4, 2, -3]} intensity={1.2} color="#ffc9a0" />
      <Glow selected={selected} catalog={catalog} />
      <group ref={group}>{SHOES.map((s, i) => <RingShoe key={s.id} shoe={s} index={i} catalog={catalog} group={group} />)}</group>
    </>
  );
}

/** @param {{ selected: number }} props */
export default function Ring({ selected }) {
  const wrap = useRef(null); const [inView, setIn] = useState(false);
  useEffect(() => { const io = new IntersectionObserver(([e]) => setIn(e.isIntersecting), { rootMargin: '200px' }); io.observe(wrap.current); return () => io.disconnect(); }, []);
  return (
    <div ref={wrap} aria-hidden="true" className="pointer-events-none absolute inset-0">
      <Canvas frameloop={inView ? 'always' : 'never'} dpr={[1, 1.75]} gl={{ alpha: true }} camera={{ position: [0, 1.5, 9.5], fov: 32 }} onCreated={({ camera }) => camera.lookAt(0, 0, 0)}>
        <Suspense fallback={null}><Scene selected={selected} /></Suspense>
      </Canvas>
    </div>
  );
}
