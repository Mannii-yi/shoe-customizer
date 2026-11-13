import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { notFound } from '../utils/errors.js';

// MOCK: the catalog is read from contracts/catalog.seed.json, not from the database.
// Replace loadCatalogs() with a Prisma loader once the Neon connection works.
const seedPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../contracts/catalog.seed.json',
);

const CACHE_MS = 60_000;
let cache = null; // { at, catalogs: Map<modelId, internalCatalog> }

async function loadCatalogs() {
  const seed = JSON.parse(await readFile(seedPath, 'utf8'));
  return new Map([[seed.model.id, seed]]);
}

async function catalogs() {
  if (!cache || Date.now() - cache.at > CACHE_MS) {
    cache = { at: Date.now(), catalogs: await loadCatalogs() };
  }
  return cache.catalogs;
}

/**
 * Internal catalog for pricing (includes rule params).
 * @param {string} modelId
 * @throws {AppError} 404 when the model does not exist
 */
export async function getInternalCatalog(modelId) {
  const catalog = (await catalogs()).get(modelId);
  if (!catalog) throw notFound(`Model "${modelId}" not found`);
  return catalog;
}

/**
 * Public catalog in the exact API shape: rules show id/label/type only.
 * @param {string} modelId
 */
export async function getPublicCatalog(modelId) {
  const c = await getInternalCatalog(modelId);
  return {
    model: {
      id: c.model.id,
      name: c.model.name,
      basePriceInr: c.model.basePriceInr,
      glbPath: c.model.glbPath,
      defaultConfiguration: c.model.defaultConfiguration,
    },
    parts: c.parts.map((p) => ({
      key: p.key,
      label: p.label,
      meshName: p.meshName,
      sortOrder: p.sortOrder,
      options: {
        materials: p.options.materials.map((m) => ({
          id: m.id,
          label: m.label,
          priceDeltaInr: m.priceDeltaInr,
        })),
        colors: p.options.colors.map((o) => ({
          id: o.id,
          label: o.label,
          hex: o.hex,
          priceDeltaInr: o.priceDeltaInr,
        })),
      },
    })),
    rules: c.rules.map((r) => ({ id: r.id, label: r.label, type: r.type })),
  };
}

/** @returns {Promise<{id:string,name:string,basePriceInr:number,glbPath:string}[]>} */
export async function listModels() {
  return [...(await catalogs()).values()].map(({ model }) => ({
    id: model.id,
    name: model.name,
    basePriceInr: model.basePriceInr,
    glbPath: model.glbPath,
  }));
}
