// =============================================================================
// apps/web/src/three/Turntable.jsx
// Owner: Dev A
// =============================================================================
//
// WHAT THIS FILE IS
// A wrapper that slowly spins everything inside it, like a showroom turntable,
// while the store's `autoRotate` switch is on.
//
// WHY IT EXISTS
// Dev B's landing page shows the shoe turning slowly in the hero scene, and
// turns the spin off when the story moves on. They only call
// setAutoRotate(true / false); this component does the spinning.
//
// WHY WE SPIN THE SHOE AND NOT THE CAMERA
// Spinning the shoe works the same for both variants (the landing page has no
// camera controls) and never fights the camera presets. Because the explode
// movement happens INSIDE this group, an exploded shoe turns as one piece.
//
// When the switch goes off, the shoe stops where it is (it does not snap back).
// =============================================================================

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

import { useShoeStore } from '../store/shoeStore';


// Spin speed in radians per second. 0.4 is about one full turn every 16 seconds.
const SPIN_SPEED = 0.4;


/**
 * Spins its children around the vertical axis while autoRotate is on.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - What to spin (the shoe).
 */
export function Turntable({ children }) {
  const groupRef = useRef(null);

  // Runs about 60 times per second. `delta` = seconds since the last frame, so
  // the spin speed is the same on a fast laptop and a slow phone.
  useFrame((_state, delta) => {
    const { autoRotate } = useShoeStore.getState();

    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * SPIN_SPEED;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}