// =============================================================================
// apps/web/src/three/explode.js
// Owner: Dev A
// =============================================================================
//
// WHAT THIS FILE IS
// The math of the "explode" animation. Given a part and a single number
// `explode` (0 = assembled, 1 = fully apart), it says how far that part moves
// away from its assembled position.
//
// WHY IT IS A SEPARATE, PURE FILE
// "Pure" means: no React, no store, no 3D objects, no randomness. The same
// input always gives the same output. That makes it easy to unit test (the
// blueprint requires it) and easy to reason about.
//
// THE RULE THAT MATTERS MOST
// When explode = 0, every offset is EXACTLY zero, so the assembled shoe is
// pixel-perfect. Nothing in this file may break that.
//
// CURRENT STATE: EXPLODE V1
// Each part flies out in a straight line. The swirling orbit and tumbling are
// added in a later task.
// =============================================================================

/**
 * How each part moves when exploded.
 *
 * MOCK: these numbers are stub values chosen for the box layout in
 * partsConfig.js. They will be re-tuned for the real model using sliders.
 *
 *   dir  - direction of travel [x, y, z]. It does NOT need to be length 1;
 *          we normalize it below, so only its direction matters.
 *   dist - how far the part travels at explode = 1, in scene units.
 *
 * Design intent: the outsole and midsole drop away, the upper lifts slightly,
 * the laces float highest, the tongue tilts out, the toe cap and heel counter
 * slide to the ends, and the logo comes toward the camera.
 */
export const EXPLODE_CONFIG = {
  upper:        { dir: [0, 1, 0],    dist: 0.4 },
  toe_cap:      { dir: [1, 0.2, 0],  dist: 1.0 },
  heel_counter: { dir: [-1, 0.3, 0], dist: 1.0 },
  tongue:       { dir: [0.5, 1, 0],  dist: 1.1 },
  eyestay:      { dir: [-0.3, 1, 0], dist: 1.0 },
  laces:        { dir: [0, 1, 0],    dist: 1.9 },
  logo:         { dir: [0, 0.2, 1],  dist: 1.2 },
  insole:       { dir: [0, -1, 0],   dist: 0.7 },
  midsole:      { dir: [0, -1, 0],   dist: 1.2 },
  outsole:      { dir: [0, -1, 0],   dist: 1.8 },
};


/**
 * Keeps a number between 0 and 1.
 *
 * @param {number} n - Any number.
 * @returns {number} n limited to the range 0..1.
 */
function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}


/**
 * Smooth start and smooth end ("smoothstep"): slow at the beginning, faster in
 * the middle, slow at the end. 0 stays exactly 0 and 1 stays exactly 1.
 *
 * Why: when Dev B drives `explode` straight from scroll position, the value
 * changes in a straight line, which feels mechanical. Easing makes the motion
 * feel natural. Input and output are both in 0..1.
 *
 * @param {number} t - Progress from 0 to 1.
 * @returns {number} Eased progress from 0 to 1.
 */
export function easeInOut(t) {
  return t * t * (3 - 2 * t);
}


/**
 * How far a part has moved from its assembled position.
 *
 * @param {string} partKey - Part key, for example "upper".
 * @param {number} explode - 0 (assembled) to 1 (fully apart). Clamped.
 * @returns {[number, number, number]} Movement to ADD to the part's assembled
 *   position, as [x, y, z]. Always [0, 0, 0] when explode is 0, and for any
 *   part key that has no entry in EXPLODE_CONFIG.
 */
export function getExplodeOffset(partKey, explode) {
  const config = EXPLODE_CONFIG[partKey];
  if (!config) return [0, 0, 0];

  const eased = easeInOut(clamp01(explode));

  const [dx, dy, dz] = config.dir;
  const length = Math.hypot(dx, dy, dz) || 1; // `|| 1` avoids dividing by zero
  const scale = (config.dist * eased) / length;

  return [dx * scale, dy * scale, dz * scale];
}