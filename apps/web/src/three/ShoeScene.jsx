// =============================================================================
// apps/web/src/three/ShoeScene.jsx
// Owner: Dev A (3D Experience Engineer)
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

export function ShoeScene({ variant = 'configurator' }) {
  const interactive = variant === 'configurator';

  return (
    <Canvas
      camera={{ position: CAMERA_PRESETS.hero.position, fov: 40 }}
      gl={{ alpha: true }}
      onPointerMissed={
        interactive ? () => useShoeStore.getState().selectPart(null) : undefined
      }
    >
      <ambientLight intensity={0.6} />

      <directionalLight position={[5, 5, 5]} intensity={1.2} />

      <Turntable>
        <ModelErrorBoundary fallback={<StubShoe interactive={interactive} />}>
          <Suspense fallback={null}>
            <ShoeModel interactive={interactive} />
          </Suspense>
        </ModelErrorBoundary>
      </Turntable>

      <CameraRig />

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