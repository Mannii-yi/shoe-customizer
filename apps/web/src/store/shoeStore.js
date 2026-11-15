// =============================================================================
// apps/web/src/store/shoeStore.js
// Owner: Dev A (3D Experience Engineer)
// =============================================================================
//
// WHAT THIS FILE IS
// A "store" is one shared notebook that many parts of the app can read from and
// write to. This store holds everything the 3D shoe needs to know:
//   - which materials and colors each part currently has (configuration)
//   - how far the shoe is "exploded" (explode: 0 = assembled, 1 = fully apart)
//   - which part is selected or hovered, which camera angle is active, etc.
//
// WHY IT EXISTS
// Three developers touch the shoe:
//   - Dev B (landing page) changes `explode` as the user scrolls.
//   - Dev D (customizer panels) changes colors when the user clicks a swatch.
//   - Dev A (this scene) READS all of it and draws the shoe.
// Instead of everyone calling each other's code directly, everyone only talks
// to this store. That keeps the modules independent and avoids merge conflicts.
//
// THE RULE
// Other modules talk to the scene ONLY through this store (no refs, no
// callbacks). If you need the scene to do something new, add it here first.
//
// HOW TO USE IT
//   Inside a React component:   const explode = useShoeStore((s) => s.explode);
//   Outside React (any file):   useShoeStore.getState().setExplode(0.5);
//
// BAD INPUT NEVER CRASHES THE APP
// The contract says: unknown ids or keys -> console.warn and carry on. A scene
// that crashes on one typo would break the landing page, the customizer and the
// demo, so every action below checks its input first.
// =============================================================================

import { create } from 'zustand'; // zustand: the tiny library that builds the store
import gsap from 'gsap'; // gsap: the animation library, used for tweenExplode


// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------

/**
 * The 10 customizable part keys, copied from contracts/parts.json.
 * We use this list to reject keys that do not exist (for example a typo like
 * "uper"), so a mistake cannot silently create a part that is never drawn.
 */
export const PART_KEYS = [
  'upper',
  'toe_cap',
  'heel_counter',
  'tongue',
  'eyestay',
  'laces',
  'logo',
  'insole',
  'midsole',
  'outsole',
];


/**
 * The camera angles the scene supports (the contract's CAMERA_PRESETS names).
 * The camera code (CameraRig.jsx, written later) decides WHERE each name puts
 * the camera. This list only checks that a requested name is valid.
 */
export const CAMERA_PRESET_NAMES = [
  'hero',
  'three-quarter',
  'side',
  'top',
  'sole',
  'laces',
  'exploded-wide',
];


// -----------------------------------------------------------------------------
// PRIVATE HELPERS (used only inside this file)
// -----------------------------------------------------------------------------

/**
 * Holds the explode animation that is currently running, if any.
 * It lives outside the store because it is not data the UI needs to display.
 * We keep it so a new animation (or an instant setExplode) can cancel the old
 * one; otherwise two animations would fight over the same value.
 */
let explodeTween = null;


/**
 * Keeps a number between 0 and 1.
 * Why: `explode` only makes sense in that range. Values outside it would push
 * parts to wrong positions, so we clamp instead of trusting the caller.
 *
 * @param {number} n - Any number.
 * @returns {number} 0 if n is below 0, 1 if n is above 1, otherwise n.
 */
function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}


/**
 * Makes a fully independent copy of a plain JSON object.
 * Why: the catalog's default configuration is shared data. If we handed out the
 * original and later changed a color, we would accidentally change the
 * catalog's default too. A copy keeps them separate.
 *
 * @param {object} obj - A plain JSON object (no functions, no dates).
 * @returns {object} A deep copy.
 */
function cloneJson(obj) {
  return JSON.parse(JSON.stringify(obj));
}


/**
 * Checks whether a material or color id is allowed for a part in the catalog.
 * Each part allows only some materials and colors (for example, the outsole
 * should not be "mesh"), and the catalog is the final authority on that.
 *
 * If no catalog has loaded yet we cannot check, so we accept the id. It will be
 * checked properly once the catalog arrives and the server validates it anyway.
 *
 * @param {object|null} catalog - The catalog from setCatalog, or null.
 * @param {string} partKey - Which part, for example "upper".
 * @param {'materials'|'colors'} kind - Which option list to check.
 * @param {string} id - The material or color id, for example "crimson".
 * @returns {boolean} true if the id is allowed (or cannot be checked yet).
 */
function isKnownOption(catalog, partKey, kind, id) {
  if (!catalog) return true;

  const part = catalog.parts.find((p) => p.key === partKey);
  if (!part) return false;

  return part.options[kind].some((option) => option.id === id);
}


/**
 * Returns the id if it is valid, otherwise warns and returns a fallback.
 * Why: the contract says an unknown colorId/materialId must fall back to the
 * default and never crash the scene.
 *
 * @param {object|null} catalog - The catalog, or null.
 * @param {string} partKey - Which part the id is for.
 * @param {'materials'|'colors'} kind - Which option list the id belongs to.
 * @param {string} id - The id the caller asked for.
 * @param {string|undefined} fallbackId - The id to use if `id` is not valid.
 * @returns {string|undefined} `id` if valid, otherwise `fallbackId`.
 */
function resolveOption(catalog, partKey, kind, id, fallbackId) {
  if (isKnownOption(catalog, partKey, kind, id)) return id;

  console.warn(
    `[shoeStore] Unknown ${kind} id "${id}" for part "${partKey}". Using default.`,
  );
  return fallbackId;
}


// -----------------------------------------------------------------------------
// THE STORE
// -----------------------------------------------------------------------------

/**
 * The scene store.
 *
 * `create` gives us a function that receives two helpers:
 *   set(...) - saves new values into the store (and tells React to re-draw)
 *   get()    - reads the current values (used when an action needs them)
 */
export const useShoeStore = create((set, get) => ({

  // ===========================================================================
  // STATE: the values the app reads
  // ===========================================================================

  /**
   * The catalog (parts, allowed options, hex colors, prices).
   * Starts null; Dev D loads it from the API and calls setCatalog().
   * We never copy colors or prices into our own code, because the catalog is
   * the single source of truth and a copy would go out of date.
   */
  catalog: null,

  /**
   * What each part currently looks like: { parts: { upper: { materialId,
   * colorId }, ... } }. Starts empty and is filled from the catalog's default
   * configuration, so no defaults are hard-coded here.
   */
  configuration: { parts: {} },

  /** How far the shoe is exploded. 0 = assembled exactly, 1 = fully apart. */
  explode: 0,

  /** Key of the part the user clicked (for example "upper"), or null for none. */
  selectedPartKey: null,

  /** Key of the part the pointer is over right now, or null for none. */
  hoveredPartKey: null,

  /** Name of the active camera angle (must be in CAMERA_PRESET_NAMES). */
  cameraPreset: 'hero',

  /** Whether the shoe slowly turns by itself (like a turntable). */
  autoRotate: false,

  /** Whether exploded parts drift in their orbit. The explosion itself stays. */
  swirlEnabled: true,

  /**
   * Becomes true once the 3D model has loaded. Dev B's preloader waits for it
   * so visitors never see a half-loaded scene.
   */
  isModelReady: false,


  // ===========================================================================
  // ACTIONS (public contract): the functions other developers call
  // ===========================================================================

  /**
   * Stores the catalog, and sets the starting configuration if there is none.
   * Why: the scene needs the catalog to turn a colorId like "crimson" into a
   * real color, and to know which options each part allows.
   *
   * We only fill the configuration when it is still empty, so calling this
   * again later (for example after a refetch) does not wipe the user's choices.
   *
   * @param {object} catalog - { model, parts, rules } as in the API contract.
   */
  setCatalog: (catalog) => {
    // Refuse anything that is not shaped like a catalog, instead of crashing later.
    if (!catalog || !catalog.model || !Array.isArray(catalog.parts)) {
      console.warn('[shoeStore] setCatalog ignored: expected { model, parts, rules }.');
      return;
    }

    const hasConfiguration = Object.keys(get().configuration.parts).length > 0;

    set({
      catalog,
      configuration: hasConfiguration
        ? get().configuration
        : cloneJson(catalog.model.defaultConfiguration),
    });
  },


  /**
   * Replaces the whole configuration at once.
   * Used when loading a saved design or a shared link, where every part's
   * material and color arrives together. Unknown part keys are dropped.
   *
   * @param {{ parts: object }} cfg - A configuration in the contract's shape.
   */
  setConfiguration: (cfg) => {
    if (!cfg || typeof cfg.parts !== 'object' || cfg.parts === null) {
      console.warn('[shoeStore] setConfiguration ignored: expected { parts: {...} }.');
      return;
    }

    const parts = {};

    for (const key of Object.keys(cfg.parts)) {
      if (PART_KEYS.includes(key)) {
        parts[key] = { ...cfg.parts[key] };
      } else {
        console.warn(`[shoeStore] Ignoring unknown part key "${key}".`);
      }
    }

    set({ configuration: { parts } });
  },


  /**
   * Changes the material and/or color of ONE part. This is what runs when the
   * user clicks a swatch in Dev D's panel.
   *
   * You can pass just one of the two: setPartOption('upper', { colorId: 'sky' })
   * leaves the material alone. A color or material the catalog does not allow
   * for that part falls back to the default, with a console warning.
   *
   * @param {string} partKey - Which part to change, for example "upper".
   * @param {{ materialId?: string, colorId?: string }} options - What to change.
   */
  setPartOption: (partKey, { materialId, colorId } = {}) => {
    if (!PART_KEYS.includes(partKey)) {
      console.warn(`[shoeStore] setPartOption ignored: unknown part "${partKey}".`);
      return;
    }

    const { catalog, configuration } = get();

    // What the part has now, and what the catalog says its default is.
    const current = configuration.parts[partKey] ?? {};
    const fallback = catalog?.model?.defaultConfiguration?.parts?.[partKey] ?? {};

    // Start from the current values so anything we do not change stays as it was.
    const next = { ...current };

    if (materialId !== undefined) {
      next.materialId = resolveOption(
        catalog,
        partKey,
        'materials',
        materialId,
        fallback.materialId ?? current.materialId,
      );
    }

    if (colorId !== undefined) {
      next.colorId = resolveOption(
        catalog,
        partKey,
        'colors',
        colorId,
        fallback.colorId ?? current.colorId,
      );
    }

    // Build a NEW configuration object. React only notices a change when the
    // object is replaced, not when the old one is edited in place.
    set({
      configuration: {
        parts: { ...configuration.parts, [partKey]: next },
      },
    });
  },


  /**
   * Puts every part back to the catalog's default look, and clears the
   * selection. Dev D calls this when the customizer page opens and when the user
   * presses Reset. With no catalog yet, it simply empties the configuration.
   */
  resetConfiguration: () => {
    const { catalog } = get();

    set({
      configuration: catalog
        ? cloneJson(catalog.model.defaultConfiguration)
        : { parts: {} },
      selectedPartKey: null,
      hoveredPartKey: null,
    });
  },


  /**
   * Sets how exploded the shoe is, instantly.
   * Dev B calls this on every scroll step: scroll position -> explode value.
   * Any running tweenExplode animation is cancelled first, so the two cannot
   * fight over the value.
   *
   * @param {number} n - 0 (assembled) to 1 (fully exploded). Clamped to that range.
   */
  setExplode: (n) => {
    if (typeof n !== 'number' || !Number.isFinite(n)) {
      console.warn('[shoeStore] setExplode ignored: expected a number.');
      return;
    }

    if (explodeTween) {
      explodeTween.kill();
      explodeTween = null;
    }

    set({ explode: clamp01(n) });
  },


  /**
   * Smoothly animates `explode` to 0 or 1.
   * Dev D calls this from the Customize / Assemble button so the parts glide
   * apart or together instead of jumping.
   *
   * How it works: gsap animates a small helper object, and on every frame we
   * copy its value into the store. If a tween is already running, we cancel it
   * and start from wherever the shoe currently is, so a quick double-click
   * never makes the shoe jump.
   *
   * @param {0|1} target - 1 to explode, 0 to assemble.
   * @param {{ duration?: number }} [options] - Seconds the animation takes (default 1.2).
   */
  tweenExplode: (target, { duration = 1.2 } = {}) => {
    const end = clamp01(Number(target) || 0);

    if (explodeTween) explodeTween.kill();

    const proxy = { value: get().explode };

    explodeTween = gsap.to(proxy, {
      value: end,
      duration,
      ease: 'power2.inOut', // starts and ends gently, fastest in the middle

      // We call set() directly here instead of setExplode(), because setExplode
      // cancels running tweens, and this tween would cancel itself every frame.
      onUpdate: () => set({ explode: clamp01(proxy.value) }),

      onComplete: () => {
        explodeTween = null;
      },
    });
  },


  /**
   * Marks one part as selected (the user clicked it), or clears the selection.
   * Dev D's part list and the 3D scene both read this, so clicking a part in
   * either place highlights it in both.
   *
   * @param {string|null} key - A part key, or null to deselect.
   */
  selectPart: (key) => {
    if (key !== null && !PART_KEYS.includes(key)) {
      console.warn(`[shoeStore] selectPart ignored: unknown part "${key}".`);
      return;
    }

    set({ selectedPartKey: key });
  },


  /**
   * Moves the camera to one of the named angles (hero, side, sole, ...).
   * Dev B uses this to direct the landing page story; the camera code reads it
   * and glides there smoothly.
   *
   * @param {string} name - One of CAMERA_PRESET_NAMES.
   */
  setCameraPreset: (name) => {
    if (!CAMERA_PRESET_NAMES.includes(name)) {
      console.warn(`[shoeStore] setCameraPreset ignored: unknown preset "${name}".`);
      return;
    }

    set({ cameraPreset: name });
  },


  /**
   * Turns the slow automatic rotation on or off.
   * The landing page uses it for the hero turntable; the configurator keeps it
   * off while the user drags the shoe themselves.
   *
   * @param {boolean} value - true to rotate, false to stop.
   */
  setAutoRotate: (value) => set({ autoRotate: Boolean(value) }),


  /**
   * Turns the orbiting drift of exploded parts on or off.
   * The explosion itself is unaffected; only the swirling motion stops.
   *
   * @param {boolean} value - true for swirl, false for none.
   */
  setSwirlEnabled: (value) => set({ swirlEnabled: Boolean(value) }),


  // ===========================================================================
  // SCENE-ONLY ADDITIONS
  // Optional extras for the scene's own use. They are not in the original
  // contract, but adding actions never breaks anyone, so this is allowed. They
  // will be documented in contracts/scene-api.md.
  // ===========================================================================

  /**
   * Called by the scene when the pointer moves over a part (or leaves, with null).
   * Other developers can read hoveredPartKey, but only the scene writes it.
   *
   * @param {string|null} key - A part key, or null when no part is hovered.
   */
  setHoveredPart: (key) => {
    if (key !== null && !PART_KEYS.includes(key)) return;

    set({ hoveredPartKey: key });
  },


  /**
   * Called by the scene once the 3D model has finished loading.
   * Dev B's preloader waits for isModelReady to become true.
   *
   * @param {boolean} ready - true when the model is loaded.
   */
  setModelReady: (ready) => set({ isModelReady: Boolean(ready) }),
}));