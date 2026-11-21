// =============================================================================
// apps/web/src/three/catalogLookup.js
// Owner: Dev A
// =============================================================================
//
// WHAT THIS FILE IS
// Small helper functions that read values out of the catalog.
//
// WHY IT EXISTS
// A configuration only stores ids, like { colorId: "crimson" }. To actually
// paint a part, the scene needs the matching hex color (#B3202A). That hex
// lives ONLY in the catalog, so every part of the scene asks this helper
// instead of keeping its own list of colors. If Dev C changes a color in the
// catalog, the scene follows automatically.
//
// This file is pure (no React, no store), so it is easy to unit test later.
// The catalog comes from outside (the API), so every inner piece is checked
// before it is used: a malformed catalog gives the neutral fallback color
// instead of crashing the scene.
// =============================================================================

/**
 * Neutral grey shown ONLY while the catalog has not loaded yet, or if the
 * catalog data is broken. It is a safe placeholder, not a real product color.
 */
export const FALLBACK_HEX = '#808080';


/**
 * Finds a color's hex code for one part, or null if the part or color is unknown.
 * Never throws, even if the catalog has missing or malformed pieces.
 *
 * @param {object} catalog - The catalog ({ model, parts, rules }).
 * @param {string} partKey - Part key, for example "upper".
 * @param {string} colorId - Color id, for example "crimson".
 * @returns {string|null} A hex string like "#B3202A", or null if not found.
 */
function findColorHex(catalog, partKey, colorId) {
  const parts = Array.isArray(catalog.parts) ? catalog.parts : [];
  const part = parts.find((p) => p?.key === partKey);
  const colors = part?.options?.colors;
  if (!Array.isArray(colors)) return null;

  return colors.find((c) => c?.id === colorId)?.hex ?? null;
}


/**
 * Returns the hex color a part should be painted with.
 *
 * Fallback order, as the contract requires (never crash):
 *   1. The requested color, if the catalog allows it for this part.
 *   2. Otherwise a console warning, then the part's DEFAULT color.
 *   3. Otherwise neutral grey (FALLBACK_HEX).
 * If the catalog has not loaded yet, it quietly returns grey (no warning,
 * because that is a normal state during startup).
 *
 * @param {object|null} catalog - The catalog from the store, or null.
 * @param {string} partKey - Part key, for example "upper".
 * @param {string|undefined} colorId - Color id from the configuration.
 * @returns {string} A hex color string.
 */
export function getPartColorHex(catalog, partKey, colorId) {
  if (!catalog) return FALLBACK_HEX;

  const hex = findColorHex(catalog, partKey, colorId);
  if (hex) return hex;

  console.warn(
    `[catalogLookup] Unknown color "${colorId}" for part "${partKey}". Using the default color.`,
  );

  const defaultColorId = catalog.model?.defaultConfiguration?.parts?.[partKey]?.colorId;

  return findColorHex(catalog, partKey, defaultColorId) ?? FALLBACK_HEX;
}