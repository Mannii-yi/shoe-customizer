# Scene API contract

- **Owner:** Dev A (3D Experience Engineer)
- **Status:** proposed for contract-v1
- **Consumers:** Dev B (landing page), Dev D (customizer, cart, accounts)

This file is the written promise of what the 3D scene offers. Dev B and Dev D talk to
the scene **only** through the items listed here. Anything not listed is private to
Dev A and may change without notice.

## 1. How to import

Everything comes from one place, the public entry point of the 3D module:

```js
import {
  ShoeScene,
  useShoeStore,
  PART_KEYS,
  CAMERA_PRESET_NAMES,
  CAMERA_PRESETS,
  captureThumbnail,
} from '../three'; // adjust the relative path to where you are
```

## 2. The `<ShoeScene />` component

```jsx
<ShoeScene variant="hero" | "configurator" />
```

| Prop | Values | Default | Meaning |
|---|---|---|---|
| `variant` | `"hero"` or `"configurator"` | `"configurator"` | See below. |
| `quality` | `"auto"`, `"low"`, `"high"` | none | **Reserved.** Accepted but currently ignored. |

- **Size:** the scene fills its parent element. The parent MUST have a width and height,
  otherwise nothing is visible.
- **Background:** the canvas is transparent, so the page behind it shows through.
- **`hero`:** no user controls and no part picking, so the page keeps scrolling normally.
- **`configurator`:** drag to rotate (no panning), scroll or pinch to zoom (limited to a
  distance range so the shoe cannot be lost), and part picking (hover, click, click empty
  space to deselect).
- Rotating the shoe never changes `explode`. Explode is driven only by the store.

## 3. The store: `useShoeStore`

A Zustand store. Inside React components:

```js
const explode = useShoeStore((state) => state.explode);
```

Outside React (for example in a scroll handler):

```js
useShoeStore.getState().setExplode(0.5);
```

### 3.1 State

| Field | Type | Initial | Notes |
|---|---|---|---|
| `catalog` | object or `null` | `null` | Set by Dev D with `setCatalog`. |
| `configuration` | `{ parts: { [partKey]: { materialId, colorId } } }` | `{ parts: {} }` | Filled from the catalog default when the catalog is first set. |
| `explode` | number, 0 to 1 | `0` | 0 = assembled exactly, 1 = fully apart. |
| `selectedPartKey` | string or `null` | `null` | Written by the scene on click and by `selectPart`. |
| `hoveredPartKey` | string or `null` | `null` | Written by the scene. Read-only for other developers. |
| `cameraPreset` | string | `"hero"` | One of the preset names in section 5. |
| `autoRotate` | boolean | `false` | Slow turntable spin of the shoe. |
| `swirlEnabled` | boolean | `true` | Reserved for the orbiting swirl. Stored now, **no visible effect yet**. |
| `isModelReady` | boolean | `false` | `true` once the shoe is ready to show. Dev B's preloader waits for it. |

### 3.2 Actions

All actions validate their input. **Bad input never throws:** the call is ignored or falls
back, with a `console.warn`.

| Action | What it does | Invalid input |
|---|---|---|
| `setCatalog(catalog)` | Stores the catalog (shape: `{ model, parts, rules }`). If no configuration exists yet, sets it to `catalog.model.defaultConfiguration`. Safe to call again; it never wipes the user's choices. | Wrong shape: ignored. |
| `setConfiguration(cfg)` | Replaces the whole configuration (for loading a saved or shared design). Shape `{ parts: {...} }`. | Wrong shape: ignored. Unknown part keys are dropped. |
| `setPartOption(partKey, { materialId?, colorId? })` | Changes the material and/or color of one part. Pass only what changes. | Unknown part: ignored. A material or color the catalog does not allow for that part: falls back to that part's default. (Before the catalog has loaded the ids are accepted.) |
| `resetConfiguration()` | Back to the catalog default (empty if there is no catalog yet). Also clears the selection and hover. | none |
| `setExplode(n)` | Jumps to `n`, clamped to 0..1. Cancels a running `tweenExplode`. Use for scroll-driven explode. | Not a finite number: ignored. |
| `tweenExplode(target, { duration = 1.2 })` | Glides explode from its current value to `target` (0 or 1) with easing. A new call cancels the previous one. Use for Customize / Assemble. | Non-numbers are treated as 0. Numbers are clamped to 0..1. |
| `selectPart(key)` | Selects a part, or `null` to clear. | Unknown key: ignored. |
| `setCameraPreset(name)` | Glides the camera to a named view in about one second. If the user grabs the shoe during the glide, the glide stops. | Unknown name: ignored. |
| `setAutoRotate(bool)` | Starts or stops the slow turntable spin. The shoe stops where it is (no snap-back). | Coerced to boolean. |
| `setSwirlEnabled(bool)` | Switches the orbiting drift of exploded parts. **No visible effect yet.** | Coerced to boolean. |

### 3.3 Scene-only actions (additions)

These exist for the scene's own use. Other developers may **read** the state they write, but
should not call them.

| Action | Used for |
|---|---|
| `setHoveredPart(key or null)` | The scene reports which part the pointer is over. |
| `setModelReady(bool)` | The scene reports that the shoe has loaded. |

## 4. Part keys

Exactly ten customizable parts, exported as `PART_KEYS`:

`upper`, `toe_cap`, `heel_counter`, `tongue`, `eyestay`, `laces`, `logo`, `insole`,
`midsole`, `outsole`

The part keys and mesh names are the same as in the catalog (`catalog.seed.json`).

## 5. Camera presets

Exported as `CAMERA_PRESET_NAMES` (names) and `CAMERA_PRESETS` (positions):

| Name | View |
|---|---|
| `hero` | Default three-quarter view from the front and above. The starting view. |
| `three-quarter` | A closer three-quarter view. |
| `side` | Straight at the side of the shoe. |
| `top` | Looking down on the shoe. |
| `sole` | Looking up at the underside. |
| `laces` | Close on the laces and tongue area. |
| `exploded-wide` | Pulled back so a fully exploded shoe fits on screen. |

The **names are stable**. The exact camera numbers will be re-tuned when the real model
replaces the placeholder shoe, so do not copy them.

## 6. `captureThumbnail()`

```js
const dataUrl = await captureThumbnail();
```

Returns a Promise that resolves to a JPEG data URL, 512 x 512 pixels, under 150 KB.
Intended use: attach a preview picture when saving a design.

> **MOCK today:** returns a dark placeholder picture labelled "MOCK THUMBNAIL". It already
> has the final shape, so the save flow can be built against it. The real version (render
> of the assembled shoe) comes in a later task.

## 7. Guarantees

- The scene never calls the API and never computes a price.
- With `explode = 0` every part is exactly in its assembled position.
- Rotation never changes `explode`.
- Unknown part keys, material ids, color ids or preset names never crash the scene.
- Components talk to the scene only through the store and the exports in section 1
  (no refs, no callbacks).
- Replacing the placeholder shoe with the real model does not change anything in this file.

## 8. Usage notes

**Dev B (landing page)**

- Drive the story with `setExplode`, `setCameraPreset`, `setAutoRotate` and `setPartOption`.
- When the landing page unmounts, reset: `setExplode(0)` and `setCameraPreset('hero')`.
- The preloader can wait for `isModelReady`.

**Dev D (customizer)**

- When the catalog loads: `setCatalog(catalog)`, then `resetConfiguration()` when the
  customizer page mounts.
- Customize / Assemble button: `tweenExplode(1)` and `tweenExplode(0)`.
- Keep the part list and the 3D scene in sync through `selectedPartKey` and `selectPart`.
- Swatches call `setPartOption`. Show prices from the catalog and the server quote only.
- Save design: `await captureThumbnail()`.

## 9. Known limitations (at the time of writing)

- The shoe is a placeholder made of ten boxes; the real model follows in a later PR.
- `quality` is ignored; `swirlEnabled` has no visual effect yet.
- `captureThumbnail()` is a mock.
- Touch behaviour of the `hero` variant (page scroll on phones) has not been tested on a real
  device yet.
- Lighting is basic and will be improved with the real model.

## 10. Changing this contract

Changes go through a pull request labelled `contract` and need approval from all four
developers. Adding optional things is fine. Renaming or removing something is not, without
the process.