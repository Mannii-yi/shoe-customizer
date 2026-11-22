// =============================================================================
// apps/web/src/three/highlight.js
// Owner: Dev A
// =============================================================================
//
// WHAT THIS FILE IS
// The glow used to show which part is hovered or selected. It is shared by the
// placeholder shoe (StubShoe) and the real shoe (ShoeModel), so both look the
// same and the numbers live in one place.
//
// This is a UI accent, NOT a product color, so it is fine that it does not come
// from the catalog.
// =============================================================================

/** The glow color (a gold accent). */
export const HIGHLIGHT_COLOR = '#D4AF37';

/** How strongly a part glows while the pointer is over it. */
export const HOVER_INTENSITY = 0.35;

/** How strongly the selected part glows. */
export const SELECTED_INTENSITY = 0.7;