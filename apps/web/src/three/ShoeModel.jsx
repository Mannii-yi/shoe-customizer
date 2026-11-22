// =============================================================================
// apps/web/src/three/ShoeModel.jsx
// Owner: Dev A
// =============================================================================
//
// WHAT THIS FILE IS
// The REAL shoe: loads runner.glb (the Blender model) and behaves exactly like
// the placeholder boxes in StubShoe:
//   - colors come from the store (configuration + catalog)
//   - parts fly apart when the store's `explode` value goes up
//   - in the configurator, parts glow on hover and can be clicked to select
//
// WHY IT KEEPS THE SAME BEHAVIOUR AS THE STUB
// Dev B and Dev D only talk to the store, so swapping boxes for the real shoe
// changes nothing for them.
//
// SAFETY RULES
//   1. We never edit the model that the loader cached. useGLTF hands the SAME
//      objects to every canvas that loads this URL (Dev B's ring of shoes loads
//      it too), so we clone the scene, and give every part its own cloned
//      material. Geometry is shared and never changed, so we never dispose it.
//   2. If the file does not contain all ten parts, we log which are missing and
//      show the placeholder shoe instead of a broken one.
// =============================================================================

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';

import { PART_LAYOUT } from './partsConfig';
import { StubShoe } from './StubShoe';
import { getPartColorHex } from './catalogLookup';
import { getExplodeOffset } from './explode';
import { HIGHLIGHT_COLOR, HOVER_INTENSITY, SELECTED_INTENSITY } from './highlight';
import { useShoeStore } from '../store/shoeStore';


// Where the model file is. The contract promises this path (VITE_MODEL_URL).
const MODEL_URL = import.meta.env.VITE_MODEL_URL || '/models/runner.glb';

// The file is Draco-compressed. The decoder (a small program that unpacks it)
// is hosted in our own public folder, so the shoe does not depend on the internet.
const DRACO_DECODER_PATH = '/draco/';

// How long (in scene units) the shoe is made to be, so that the camera presets
// and explode distances, which were tuned on the 3-unit-long placeholder, still fit.
const TARGET_LENGTH = 3;

// If the model faces the wrong way (toe not pointing toward +x), turn it with
// this angle in radians (for example Math.PI / 2). 0 = leave as exported.
const MODEL_ROTATION_Y = 0;

// Tell the loader where our decoder is. This must happen before the first load.
useGLTF.setDecoderPath(DRACO_DECODER_PATH);

// Lookup: mesh name -> part key ("part_upper" -> "upper").
const PART_KEY_BY_MESH = Object.fromEntries(
  PART_LAYOUT.map((part) => [part.meshName, part.key]),
);

// Reusable helpers so we do not create new objects 60 times a second.
const Y_AXIS = new Vector3(0, 1, 0);
const offsetVector = new Vector3();


/**
 * Builds our private copy of the shoe from the loaded file.
 * Runs once per loaded file.
 *
 * @param {object} gltf - The loaded model from useGLTF.
 * @returns {{ root: object, scale: number, center: Vector3, parts: object, materials: object[] }}
 */
function buildModel(gltf) {
  // Our own copy of the scene, so we never touch the cached original.
  const root = gltf.scene.clone(true);

  // Measure the assembled shoe, then work out how much to scale it.
  const box = new Box3().setFromObject(root);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const longestSide = Math.max(size.x, size.z) || 1;
  const scale = TARGET_LENGTH / longestSide;

  if (import.meta.env.DEV) {
    console.info(
      '[ShoeModel] size',
      size.toArray().map((n) => Number(n.toFixed(3))),
      'scale',
      Number(scale.toFixed(4)),
    );
  }

  // For every part: remember where it starts, and give it its own material.
  const parts = {};
  const materials = [];

  for (const part of PART_LAYOUT) {
    const mesh = root.getObjectByName(part.meshName);
    const material = mesh.material.clone();

    mesh.material = material;
    materials.push(material);

    parts[part.key] = { mesh, base: mesh.position.clone(), material };
  }

  return { root, scale, center, parts, materials };
}


/**
 * The loaded shoe, once we know the file has all ten parts.
 *
 * @param {object} props
 * @param {object} props.gltf - The loaded model.
 * @param {boolean} props.interactive - true in the configurator (hover and click work).
 */
function LoadedShoe({ gltf, interactive }) {
  const catalog = useShoeStore((state) => state.catalog);
  const configuration = useShoeStore((state) => state.configuration);
  const hoveredPartKey = useShoeStore((state) => state.hoveredPartKey);
  const selectedPartKey = useShoeStore((state) => state.selectedPartKey);

  // Build our private copy once per loaded file.
  const model = useMemo(() => buildModel(gltf), [gltf]);

  // Paint every part: color from the catalog, glow from hover and selection.
  useEffect(() => {
    for (const part of PART_LAYOUT) {
      const { material } = model.parts[part.key];
      const colorId = configuration.parts[part.key]?.colorId;

      material.color.set(getPartColorHex(catalog, part.key, colorId));

      let glow = 0;
      if (part.key === selectedPartKey) glow = SELECTED_INTENSITY;
      else if (part.key === hoveredPartKey) glow = HOVER_INTENSITY;

      material.emissive.set(HIGHLIGHT_COLOR);
      material.emissiveIntensity = glow;
    }
  }, [model, catalog, configuration, hoveredPartKey, selectedPartKey]);

  // Tell the rest of the app the shoe is ready (Dev B's preloader waits for it).
  useEffect(() => {
    useShoeStore.getState().setModelReady(true);

    return () => {
      useShoeStore.getState().setModelReady(false);
    };
  }, []);

  // Free the materials WE created when the shoe goes away. The geometry belongs
  // to the shared cache (other canvases use it), so it is never disposed here.
  useEffect(() => {
    return () => {
      model.materials.forEach((material) => material.dispose());
    };
  }, [model]);

  // Safety net: never leave the cursor stuck as a pointing hand.
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  // Runs about 60 times per second: move every part by its explode offset.
  useFrame(() => {
    const { explode } = useShoeStore.getState();

    for (const part of PART_LAYOUT) {
      const { mesh, base } = model.parts[part.key];
      const [ox, oy, oz] = getExplodeOffset(part.key, explode);

      // The offset is defined in scene units with the toe toward +x. Undo the
      // model's own rotation and scale so it moves the right way and distance.
      offsetVector
        .set(ox, oy, oz)
        .applyAxisAngle(Y_AXIS, -MODEL_ROTATION_Y)
        .divideScalar(model.scale);

      mesh.position.set(
        base.x + offsetVector.x,
        base.y + offsetVector.y,
        base.z + offsetVector.z,
      );
    }
  });

  /**
   * The pointer moved over the shoe. Which part is under it?
   * (A handler on a group fires once for the whole group, so we use "move" and
   * read which part was hit from the event.)
   */
  function handlePointerMove(event) {
    event.stopPropagation();

    const partKey = PART_KEY_BY_MESH[event.object.name];
    if (!partKey) return;

    if (useShoeStore.getState().hoveredPartKey !== partKey) {
      useShoeStore.getState().setHoveredPart(partKey);
    }
    document.body.style.cursor = 'pointer';
  }

  /** The pointer left the shoe. */
  function handlePointerOut() {
    useShoeStore.getState().setHoveredPart(null);
    document.body.style.cursor = 'auto';
  }

  /** A part was clicked: select it. (Clicking empty space is handled in ShoeScene.) */
  function handleClick(event) {
    event.stopPropagation();

    const partKey = PART_KEY_BY_MESH[event.object.name];
    if (partKey) useShoeStore.getState().selectPart(partKey);
  }

  const pointerHandlers = interactive
    ? {
        onPointerMove: handlePointerMove,
        onPointerOut: handlePointerOut,
        onClick: handleClick,
      }
    : {};

  return (
    // Outer group: turns the model if it faces the wrong way (MODEL_ROTATION_Y).
    <group rotation-y={MODEL_ROTATION_Y}>
      {/* Inner group: scales the shoe to the target length and centers it. */}
      <group
        scale={model.scale}
        position={[
          -model.center.x * model.scale,
          -model.center.y * model.scale,
          -model.center.z * model.scale,
        ]}
        {...pointerHandlers}
      >
        <primitive object={model.root} />
      </group>
    </group>
  );
}


/**
 * Loads runner.glb and shows the real shoe. If the file is missing any of the
 * ten parts, logs which ones and shows the placeholder shoe instead.
 * While the file is loading, React "suspends" (see Suspense in ShoeScene.jsx).
 *
 * @param {object} props
 * @param {boolean} [props.interactive=false] - true in the configurator.
 */
export function ShoeModel({ interactive = false }) {
  const gltf = useGLTF(MODEL_URL);

  const missing = PART_LAYOUT.filter((part) => !gltf.nodes[part.meshName]?.isMesh).map(
    (part) => part.meshName,
  );

  if (missing.length > 0) {
    console.error(
      `[ShoeModel] ${MODEL_URL} is missing these parts, showing the placeholder shoe instead:`,
      missing,
    );
    return <StubShoe interactive={interactive} />;
  }

  return <LoadedShoe gltf={gltf} interactive={interactive} />;
}