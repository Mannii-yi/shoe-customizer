// =============================================================================
// apps/web/src/three/Lighting.jsx
// Owner: Dev A
// =============================================================================
//
// WHAT THIS FILE IS
// All the lights of the scene in one place:
//   1. an ambient light, so no part is ever pitch black
//   2. a WARM key light, the main light, from the front, right and above
//   3. a COOL rim light from behind, which outlines dark parts against the
//      dark page and gives the shoe a sense of depth
//   4. a soft "studio" environment made of invisible light panels
//      (Lightformers), which gives glossy and metallic materials something to
//      reflect. It is built in code: nothing is downloaded, so it also works
//      offline and on strict networks.
//
// WHY ONE FILE
// Every number that changes how the shoe looks (intensities, colors,
// directions) is at the top, so tuning the look never means digging through
// the scene code.
//
// NOTE FOR TUNING
// The canvas uses `flat` (no tone mapping) so colors on screen match the
// catalog hex colors. That also means very strong lights can clip to pure
// white: if a white part looks blown out, lower the intensities below.
// =============================================================================

import { Environment, Lightformer } from '@react-three/drei';


// ----- Tunable numbers --------------------------------------------------------

const AMBIENT_INTENSITY = 0.3; // overall base light
const KEY_INTENSITY = 1.5; // main warm light
const KEY_COLOR = '#ffe2c2'; // warm white
const RIM_INTENSITY = 1.4; // cool outline light from behind
const RIM_COLOR = '#9ec4ff'; // cool blue-white


/**
 * Renders the lights. Place it inside the <Canvas>; it draws nothing itself.
 */
export function Lighting() {
  return (
    <>
      {/* Soft base light. */}
      <ambientLight intensity={AMBIENT_INTENSITY} />

      {/* Key light: warm, front-right and above. */}
      <directionalLight position={[4, 5, 4]} intensity={KEY_INTENSITY} color={KEY_COLOR} />

      {/* Rim light: cool, behind-left and above. */}
      <directionalLight position={[-5, 3, -4]} intensity={RIM_INTENSITY} color={RIM_COLOR} />

      {/* Soft studio environment. `frames={1}` renders it once (it never changes). */}
      <Environment resolution={256} frames={1}>
        {/* Big soft box above the shoe. */}
        <Lightformer form="rect" intensity={1.5} color="#ffffff" position={[0, 6, 0]} scale={[10, 10, 1]} rotation-x={Math.PI / 2} />

        {/* A tall strip on each side, for long highlights along the shoe. */}
        <Lightformer form="rect" intensity={2.5} color="#ffffff" position={[-6, 1, 2]} scale={[1.5, 6, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={2.5} color="#ffffff" position={[6, 1, 2]} scale={[1.5, 6, 1]} rotation-y={-Math.PI / 2} />

        {/* A gentle fill from the front, low, so the underside is not black. */}
        <Lightformer form="rect" intensity={1.2} color="#ffffff" position={[0, -1, 6]} scale={[8, 3, 1]} />
      </Environment>
    </>
  );
}