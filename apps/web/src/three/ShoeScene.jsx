// =============================================================================
// apps/web/src/three/ShoeScene.jsx
// Owner: Dev A (3D Experience Engineer)
// =============================================================================
//
// WHAT THIS FILE IS
// The 3D scene: the Canvas (the window the 3D world is drawn in), the lights,
// the camera director and the shoe. Every other developer uses this one
// component to show the shoe:
//   <ShoeScene variant="hero" />          landing page, no user controls
//   <ShoeScene variant="configurator" />  customizer, drag to rotate + picking
//
// CURRENT STATE: STEP 6
// The shoe is the REAL model (ShoeModel, loaded from runner.glb). If the file
// cannot be loaded, or is missing a part, the placeholder box shoe (StubShoe)
// is shown instead, so the page never breaks.
//
// RULE
// This component fills its parent element, so the parent MUST have a size
// (width and height). If the parent has no height, the canvas is invisible.
// =============================================================================

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

import { CameraRig } from './CameraRig';
import { CAMERA_PRESETS } from './cameraPresets';
import { ModelErrorBoundary } from './ModelErrorBoundary';
import { ShoeModel } from './ShoeModel';
import { StubShoe } from './StubShoe';
import { Turntable } from './Turntable';
import { useShoeStore } from '../store/shoeStore';


/**
 * The 3D scene. Fills its parent element.
 *
 * @param {object} props
 * @param {'hero'|'configurator'} [props.variant='configurator'] - "hero" has no
 *   user controls and no picking (so page scrolling keeps working on the
 *   landing page). "configurator" lets the user drag to rotate, scroll to zoom,
 *   and click parts.
 */
export function ShoeScene({ variant = 'configurator' }) {
  const interactive = variant === 'configurator';

  return (
    <Canvas
      // Start exactly at the "hero" view so there is no jump on the first frame.
      camera={{ position: CAMERA_PRESETS.hero.position, fov: 40 }}
      gl={{ alpha: true }} // transparent background so the page backdrop shows through

      // Fires when the user clicks the canvas but hits NO part: deselect.
      // A drag-to-rotate is not counted as a click, so rotating never deselects.
      onPointerMissed={
        interactive ? () => useShoeStore.getState().selectPart(null) : undefined
      }
    >
      {/* A soft light that lights everything equally, so shadows are never pitch black. */}
      <ambientLight intensity={0.6} />

      {/* A light shining from one direction, like the sun. It gives the shoe shape. */}
      <directionalLight position={[5, 5, 5]} intensity={1.2} />

      {/* Turntable slowly spins the shoe while the store's autoRotate is on. */}
      <Turntable>
        {/* If loading the model fails, show the placeholder shoe instead. */}
        <ModelErrorBoundary fallback={<StubShoe interactive={interactive} />}>
          {/* While the file loads, show nothing (isModelReady stays false). */}
          <Suspense fallback={null}>
            <ShoeModel interactive={interactive} />
          </Suspense>
        </ModelErrorBoundary>
      </Turntable>

      {/* Glides the camera to whichever preset the store asks for. */}
      <CameraRig />

      {/* Only the configurator lets the user move the camera. No panning, so the
          shoe cannot be dragged off screen. `makeDefault` lets CameraRig find
          these controls. The distance limits stop zooming too close or too far. */}
      {interactive && (
        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={3}
          maxDistance={14}
        />
      )}
    </Canvas>
  );
}