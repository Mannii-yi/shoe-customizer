// =============================================================================
// apps/web/src/three/dev/ScenePlayground.jsx
// Owner: Dev A
// =============================================================================
//
// WHAT THIS FILE IS
// A test page for the 3D scene. It shows ONLY the scene plus a few controls, so
// I can build and test it without needing the landing page, the API or the
// customizer panels. Dev D registers it at the route /dev/scene (dev builds
// only).
//
// WHAT IT DOES NOW
//   - Loads the catalog into the store (the job Dev D's real app does later).
//   - Shows the scene.
//   - Customize / Assemble buttons and an explode slider.
//   - An auto-rotate on/off button.
//   - One button per camera preset.
//   - A readout of which part is hovered / selected, read from the store.
// All of these call the same store actions Dev B and Dev D will use.
// =============================================================================

import { useEffect } from 'react';

// Import from the public door (three/index.js), exactly like Dev B and Dev D
// will, so this test page also proves that the exports work.
import {
  ShoeScene,
  useShoeStore,
  CAMERA_PRESET_NAMES,
  captureThumbnail,
} from '../index';

// FIXTURE: the real catalog comes from Dev C's API (Dev D loads it). Until
// then we read the agreed contract file directly, as the blueprint plans.
import catalog from '../../../../../contracts/catalog.seed.json';


// Styles for the little control panel (kept here so the markup stays readable).
const panelStyle = {
  position: 'absolute',
  top: 16,
  left: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 12,
  borderRadius: 8,
  background: 'rgba(0, 0, 0, 0.6)',
  color: '#f2f0ea',
  fontFamily: 'sans-serif',
  fontSize: 14,
};


/**
 * Shows which part is hovered and which is selected, straight from the store.
 * This proves picking reaches the store, which is how Dev D's part list will
 * stay in sync with the 3D scene.
 */
function SelectionReadout() {
  const hoveredPartKey = useShoeStore((state) => state.hoveredPartKey);
  const selectedPartKey = useShoeStore((state) => state.selectedPartKey);

  return (
    <div>
      <div>hovered: {hoveredPartKey ?? 'none'}</div>
      <div>selected: {selectedPartKey ?? 'none'}</div>
    </div>
  );
}


/**
 * One button per camera preset. The active preset is shown in bold.
 * Clicking calls setCameraPreset, exactly what Dev B's landing page will do.
 */
function PresetButtons() {
  const cameraPreset = useShoeStore((state) => state.cameraPreset);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div>camera: {cameraPreset}</div>
      {CAMERA_PRESET_NAMES.map((name) => (
        <button
          key={name}
          onClick={() => useShoeStore.getState().setCameraPreset(name)}
          style={{ fontWeight: name === cameraPreset ? 'bold' : 'normal' }}
        >
          {name}
        </button>
      ))}
    </div>
  );
}


/**
 * A button that turns the slow automatic spin on or off.
 * Calls setAutoRotate, exactly what Dev B's landing page will do.
 */
function RotateToggle() {
  const autoRotate = useShoeStore((state) => state.autoRotate);

  return (
    <button onClick={() => useShoeStore.getState().setAutoRotate(!autoRotate)}>
      auto-rotate: {autoRotate ? 'on' : 'off'}
    </button>
  );
}


/**
 * Test controls for the explode animation, auto-rotate, camera presets and
 * picking readout.
 * This is its own small component so that when `explode` changes (many times
 * per second during an animation) ONLY the controls re-draw, not the 3D scene.
 */
function ExplodeControls() {
  const explode = useShoeStore((state) => state.explode);

  return (
    <div style={panelStyle}>
      {/* tweenExplode(1) glides the shoe apart; tweenExplode(0) glides it back. */}
      <button onClick={() => useShoeStore.getState().tweenExplode(1)}>
        Customize (explode)
      </button>
      <button onClick={() => useShoeStore.getState().tweenExplode(0)}>
        Assemble
      </button>

      {/* setExplode jumps straight to a value. This is what Dev B's scroll
          will do on every scroll step. */}
      <label>
        explode: {explode.toFixed(2)}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={explode}
          onChange={(event) => useShoeStore.getState().setExplode(Number(event.target.value))}
          style={{ display: 'block', width: 180 }}
        />
      </label>

      <RotateToggle />
      <PresetButtons />
      <SelectionReadout />
    </div>
  );
}


/**
 * Full-screen dark page containing the scene and the test controls.
 * The wrapper has a fixed size (the whole window), which ShoeScene needs
 * because it fills its parent. The dark color is here because the canvas
 * itself is transparent.
 */
export default function ScenePlayground() {
  useEffect(() => {
    // Put the catalog into the store, exactly like Dev D's app will do.
    useShoeStore.getState().setCatalog(catalog);

    // DEV ONLY: expose the store as `shoeStore` so we can test from the browser
    // console, for example:
    //   shoeStore.getState().setPartOption('upper', { colorId: 'crimson' })
    // This exists only in this test page, never in the real app.
    window.shoeStore = useShoeStore;

    // DEV ONLY: also expose captureThumbnail for console testing.
    window.captureThumbnail = captureThumbnail;
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0b0b0c' }}>
      <ShoeScene variant="configurator" />
      <ExplodeControls />
    </div>
  );
}