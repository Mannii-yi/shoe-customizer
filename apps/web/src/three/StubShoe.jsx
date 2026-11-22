// =============================================================================
// apps/web/src/three/StubShoe.jsx
// Owner: Dev A
// =============================================================================
//
// WHAT THIS FILE IS
// The stub shoe: 10 colored boxes named exactly like the real model's parts.
// They fly apart when the store's `explode` value goes up, and (in the
// configurator) they react to the mouse: hover, click to select.
//
// WHY IT EXISTS
//   1. Dev B and Dev D can build against a working scene from Day 2, long
//      before the real model is wired in.
//   2. Later it stays as the FALLBACK: if runner.glb is missing a part, we
//      show this instead of crashing.
//
// HOW IT WORKS
//   - COLOR: read from the store's configuration + catalog. When someone calls
//     setPartOption(...), React re-draws and the box changes color.
//   - MOVEMENT: done in useFrame (a function that runs on every frame). It
//     reads `explode` straight from the store and moves each box. This is much
//     lighter than re-rendering React components 60 times a second.
//   - PICKING: pointer events on each box write to the store
//     (hoveredPartKey / selectedPartKey). The highlight glow is drawn from
//     those store values, so a selection made in Dev D's part list lights up
//     the 3D box too, and the other way round.
// =============================================================================

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

import { PART_LAYOUT } from './partsConfig';
import { getPartColorHex } from './catalogLookup';
import { getExplodeOffset } from './explode';
import { HIGHLIGHT_COLOR, HOVER_INTENSITY, SELECTED_INTENSITY } from './highlight';
import { useShoeStore } from '../store/shoeStore';




/**
 * Draws one box per part, colored from the current configuration, moved
 * according to the current explode value, and (optionally) clickable.
 * MOCK: boxes stand in for the real shoe meshes.
 *
 * @param {object} props
 * @param {boolean} [props.interactive=false] - true in the configurator, where
 *   hover and click should work. false on the landing page.
 */
export function StubShoe({ interactive = false }) {
  // Subscribing to just these values means this component re-draws only when
  // one of them changes (a color change or a hover/selection change), not when
  // `explode` changes.
  const catalog = useShoeStore((state) => state.catalog);
  const configuration = useShoeStore((state) => state.configuration);
  const hoveredPartKey = useShoeStore((state) => state.hoveredPartKey);
  const selectedPartKey = useShoeStore((state) => state.selectedPartKey);

  // A "ref" is a handle to a 3D object. We keep one per part, stored by key,
  // so useFrame can move each box.
  const meshRefs = useRef({});

  // Safety net: if this component disappears while the pointer is over a part,
  // make sure the cursor does not stay stuck as a pointing hand.
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);


  
  // Tell the rest of the app the "model" is ready: Dev B's preloader waits for
  // isModelReady. The stub is ready instantly; the real GLB loader will set
  // this once the file has loaded. Reset to false if the scene goes away.
  useEffect(() => {
    useShoeStore.getState().setModelReady(true);

    return () => {
      useShoeStore.getState().setModelReady(false);
    };
  }, []);
  
  // Runs about 60 times per second.
  useFrame(() => {
    // getState() reads the latest value without making React re-draw.
    const { explode } = useShoeStore.getState();

    for (const part of PART_LAYOUT) {
      const mesh = meshRefs.current[part.key];
      if (!mesh) continue; // the box may not exist yet on the very first frame

      const [ox, oy, oz] = getExplodeOffset(part.key, explode);
      const [bx, by, bz] = part.position; // the assembled position

      // assembled position + explode offset
      mesh.position.set(bx + ox, by + oy, bz + oz);
    }
  });

  /**
   * The pointer moved onto a part.
   * stopPropagation makes only the NEAREST part react, so a box hidden behind
   * another one does not light up too.
   */
  function handlePointerOver(event, partKey) {
    event.stopPropagation();
    useShoeStore.getState().setHoveredPart(partKey);
    document.body.style.cursor = 'pointer';
  }

  /** The pointer left a part. */
  function handlePointerOut() {
    useShoeStore.getState().setHoveredPart(null);
    document.body.style.cursor = 'auto';
  }

  /**
   * A part was clicked: select it.
   * (Clicking empty space deselects; that is handled in ShoeScene.jsx.)
   */
  function handleClick(event, partKey) {
    event.stopPropagation();
    useShoeStore.getState().selectPart(partKey);
  }

  return (
    <group>
      {PART_LAYOUT.map((part) => {
        const colorId = configuration.parts[part.key]?.colorId;
        const hex = getPartColorHex(catalog, part.key, colorId);

        // How much this part should glow right now.
        let glow = 0;
        if (part.key === selectedPartKey) glow = SELECTED_INTENSITY;
        else if (part.key === hoveredPartKey) glow = HOVER_INTENSITY;

        // Only attach mouse handlers when the scene is interactive.
        const pointerHandlers = interactive
          ? {
              onPointerOver: (event) => handlePointerOver(event, part.key),
              onPointerOut: handlePointerOut,
              onClick: (event) => handleClick(event, part.key),
            }
          : {};

        return (
          // `name` matches the real GLB's object names, so picking and the
          // explode engine can treat the stub and the real model the same way.
          <mesh
            key={part.key}
            name={part.meshName}
            position={part.position}
            ref={(node) => {
              meshRefs.current[part.key] = node;
            }}
            {...pointerHandlers}
          >
            <boxGeometry args={part.size} />
            <meshStandardMaterial
              color={hex}
              emissive={HIGHLIGHT_COLOR}
              emissiveIntensity={glow}
            />
          </mesh>
        );
      })}
    </group>
  );
}