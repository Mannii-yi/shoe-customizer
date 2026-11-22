// =============================================================================
// apps/web/src/three/index.js
// Owner: Dev A
// =============================================================================
//
// WHAT THIS FILE IS
// The PUBLIC DOOR of the 3D module. Other developers import from here and
// nowhere else inside src/three/:
//
//   import { ShoeScene, useShoeStore, captureThumbnail } from '../three';
//
// WHY IT EXISTS
// Anything not exported here is private to the scene, which means I can rename
// or rewrite my internal files without breaking Dev B or Dev D. What is listed
// here is the promise made in contracts/scene-api.md: it may only change
// through the contract process (adding optional things is fine, changing or
// removing is not).
//
// THE RULE
// Components talk to the scene ONLY through the store and these exports (no
// callbacks, no refs).
// =============================================================================

// The 3D scene component: <ShoeScene variant="hero" | "configurator" />
export { ShoeScene } from './ShoeScene';

// The store: all state and actions (setExplode, setPartOption, selectPart, ...)
// plus the lists of valid part keys and camera preset names.
export { useShoeStore, PART_KEYS, CAMERA_PRESET_NAMES } from '../store/shoeStore';

// The saved camera views (where the camera stands for each preset).
export { CAMERA_PRESETS } from './cameraPresets';

// Returns a JPEG data URL preview of the shoe (MOCK until the real version).
export { captureThumbnail } from './thumbnail';