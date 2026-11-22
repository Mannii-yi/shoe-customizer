// =============================================================================
// apps/web/src/three/partsConfig.js
// Owner: Dev A
// =============================================================================
//
// WHAT THIS FILE IS
// Where each of the 10 STUB boxes sits and how big it is. These boxes form a
// very rough shoe shape so we can test explode, picking and colors before the
// real model is wired in.
//
// MOCK: every number below is a made-up stub value. The real shoe's positions
// come from runner.glb. When the real model is loaded, this layout is only used
// as the fallback shown if the GLB is missing a part.
//
// HOW TO READ THE NUMBERS
//   x = length of the shoe (the toe points toward +x, the heel toward -x)
//   y = up
//   z = width (the side we look at is +z)
//   Units are arbitrary "scene units"; the whole shoe is about 3 long.
//
// The list is in the same order as "sortOrder" in the catalog.
// =============================================================================

/**
 * One stub part.
 *
 * @typedef {object} PartLayout
 * @property {string} key - Part key, same as the catalog and the store (e.g. "upper").
 * @property {string} meshName - Object name in the GLB (must match contracts/parts.json).
 * @property {[number, number, number]} position - Center of the box [x, y, z].
 * @property {[number, number, number]} size - Box size [width, height, depth] along x, y, z.
 */

/** @type {PartLayout[]} */
export const PART_LAYOUT = [
  { key: 'upper',        meshName: 'part_upper',        position: [0.0, 0.0, 0.0],     size: [2.1, 0.5, 0.85] },
  { key: 'toe_cap',      meshName: 'part_toe_cap',      position: [1.25, -0.08, 0.0],  size: [0.5, 0.34, 0.8] },
  { key: 'heel_counter', meshName: 'part_heel_counter', position: [-1.25, 0.0, 0.0],   size: [0.4, 0.5, 0.9] },
  { key: 'tongue',       meshName: 'part_tongue',       position: [0.55, 0.4, 0.0],    size: [0.5, 0.3, 0.45] },
  { key: 'eyestay',      meshName: 'part_eyestay',      position: [-0.1, 0.3, 0.0],    size: [0.7, 0.1, 0.7] },
  { key: 'laces',        meshName: 'part_laces',        position: [-0.1, 0.385, 0.0],  size: [0.6, 0.07, 0.5] },
  { key: 'logo',         meshName: 'part_logo',         position: [-0.3, 0.0, 0.45],   size: [0.3, 0.18, 0.04] },
  { key: 'insole',       meshName: 'part_insole',       position: [0.0, -0.3, 0.0],    size: [2.6, 0.08, 0.8] },
  { key: 'midsole',      meshName: 'part_midsole',      position: [0.0, -0.42, 0.0],   size: [2.9, 0.16, 0.95] },
  { key: 'outsole',      meshName: 'part_outsole',      position: [0.0, -0.55, 0.0],   size: [3.0, 0.1, 1.0] },
];