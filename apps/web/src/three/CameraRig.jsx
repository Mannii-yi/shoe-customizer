// =============================================================================
// apps/web/src/three/CameraRig.jsx
// Owner: Dev A
// =============================================================================
//
// WHAT THIS FILE IS
// The camera director. It watches the store's `cameraPreset` and smoothly
// glides the camera to that view (hero, side, top, sole, ...).
//
// WHY IT EXISTS
// Dev B's landing page tells the story by calling setCameraPreset('sole') and
// so on. Dev D's panel can do the same for "view" buttons. Neither of them ever
// touches the camera itself; they only change the store, and this component
// does the moving. That keeps the rule "talk to the scene ONLY through the
// store".
//
// HOW IT WORKS
// Each preset (see cameraPresets.js) is a camera POSITION (where the camera
// stands) and a TARGET (the point it looks at). Every frame, while gliding, we
// move the camera a fraction of the way toward the preset. Taking a fraction of
// the REMAINING distance means it starts quickly and slows down as it arrives
// ("damping").
//
// It works with and without OrbitControls:
//   - configurator: OrbitControls owns the camera, so we move its target and
//     ask it to update.
//   - hero: no controls, so we point the camera ourselves with lookAt.
// =============================================================================

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

import { CAMERA_PRESETS } from './cameraPresets';
import { useShoeStore } from '../store/shoeStore';


// How quickly the camera glides. Higher = faster. About 4 settles in ~1 second.
const DAMPING = 4;

// When the camera is this close to the preset, we snap to done and stop.
const SETTLE_DISTANCE = 0.01;


/**
 * Renders nothing. Place it inside the <Canvas>. It moves the camera when the
 * store's cameraPreset changes.
 */
export function CameraRig() {
  const camera = useThree((state) => state.camera);

  // `controls` is OrbitControls when it was added with `makeDefault`, otherwise
  // null (the hero variant has none).
  const controls = useThree((state) => state.controls);

  const cameraPreset = useShoeStore((state) => state.cameraPreset);

  // Are we currently gliding toward a preset?
  const isGliding = useRef(true);

  // The point the camera is looking at right now (it glides too).
  const lookTarget = useRef(new Vector3(0, 0, 0));

  // Reusable vectors, so we do not create new objects 60 times a second.
  const desiredPosition = useRef(new Vector3());
  const desiredTarget = useRef(new Vector3());

  // A new preset was requested: start gliding.
  useEffect(() => {
    isGliding.current = true;
  }, [cameraPreset]);

  // If the user grabs the shoe (drag or zoom) during a glide, stop gliding,
  // otherwise the camera would fight their mouse.
  useEffect(() => {
    if (!controls) return undefined;

    const stopGliding = () => {
      isGliding.current = false;
    };

    controls.addEventListener('start', stopGliding);
    return () => controls.removeEventListener('start', stopGliding);
  }, [controls]);

  // Runs about 60 times per second. `delta` = seconds since the last frame.
  useFrame((_state, delta) => {
    if (!isGliding.current) return;

    const preset = CAMERA_PRESETS[cameraPreset];
    if (!preset) return;

    desiredPosition.current.set(...preset.position);
    desiredTarget.current.set(...preset.target);

    // Fraction of the remaining distance to cover this frame. Using delta
    // makes the glide last the same time at any frame rate.
    const step = 1 - Math.exp(-DAMPING * delta);

    camera.position.lerp(desiredPosition.current, step);
    lookTarget.current.lerp(desiredTarget.current, step);

    if (controls) {
      controls.target.copy(lookTarget.current);
      controls.update();
    } else {
      camera.lookAt(lookTarget.current);
    }

    // Close enough to both goals: stop, so the user can move freely.
    const positionDone =
      camera.position.distanceTo(desiredPosition.current) < SETTLE_DISTANCE;
    const targetDone =
      lookTarget.current.distanceTo(desiredTarget.current) < SETTLE_DISTANCE;

    if (positionDone && targetDone) {
      isGliding.current = false;
    }
  });

  return null;
}