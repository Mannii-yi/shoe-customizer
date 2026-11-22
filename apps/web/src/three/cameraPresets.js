// =============================================================================
// apps/web/src/three/cameraPresets.js
// Owner: Dev A
// =============================================================================
//
// WHAT THIS FILE IS
// The saved camera views: for each preset name, where the camera stands and
// what it looks at. CameraRig.jsx reads this table to move the camera, and
// ShoeScene.jsx uses the "hero" entry as the starting view.
//
// WHY IT IS ITS OWN FILE
// It is plain data, not a React component. Keeping data separate from
// components lets the dev server refresh components instantly while you edit,
// and keeps this table easy to find and tune.
// =============================================================================

/**
 * The saved camera views.
 *
 * MOCK: these numbers are stub values chosen for the box shoe in
 * partsConfig.js. They will be re-tuned for the real model.
 *
 * The keys MUST match CAMERA_PRESET_NAMES in shoeStore.js (the store rejects
 * names that are not in that list).
 *
 *   position - where the camera stands [x, y, z]
 *   target   - the point the camera looks at [x, y, z]
 *
 * Reminder: x = shoe length (toe at +x), y = up, z = width (logo side at +z).
 */
export const CAMERA_PRESETS = {
  hero:            { position: [3.5, 2.2, 4.5], target: [0, 0, 0] },
  'three-quarter': { position: [3.2, 1.4, 3.4], target: [0, 0, 0] },
  side:            { position: [0, 0.3, 6.2],   target: [0, 0, 0] },
  top:             { position: [0, 6.5, 0.6],   target: [0, 0, 0] }, // z is not 0 on purpose: looking exactly straight down confuses the camera's "up" direction
  sole:            { position: [1.2, -6.2, 2],  target: [0, -0.3, 0] },
  laces:           { position: [1.8, 3.2, 2.6], target: [-0.1, 0.4, 0] },
  'exploded-wide': { position: [5.5, 3.2, 8.5], target: [0, 0, 0] },
};