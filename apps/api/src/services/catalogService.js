import { prisma } from '../db.js';
import { notFound } from '../utils/errors.js';

const CACHE_MS = 60_000; // the catalog changes rarely, so reads are cached for 60 seconds

/** @type {{at:number, promise:Promise<Map<string,object>>}|null} */
let cache = null;

/** Turns a database model (with parts, options and rules) into the internal catalog shape. */
function toInternalCatalog(m) {
  return [
    m.id,
    {
      model: {
        id: m.id,
        name: m.name,
        basePriceInr: m.basePriceInr,
        glbPath: m.glbPath,
        defaultConfiguration: m.defaultConfiguration,
      },
      parts: m.parts.map((p) => ({
        key: p.key,
        label: p.label,
        meshName: p.meshName,
        sortOrder: p.sortOrder,
        options: {
          materials: p.options
            .filter((o) => o.kind === 'MATERIAL')
            .map((o) => ({ id: o.slug, label: o.label, priceDeltaInr: o.priceDeltaInr })),
          colors: p.options
            .filter((o) => o.kind === 'COLOR')
            .map((o) => ({ id: o.slug, label: o.label, hex: o.value, priceDeltaInr: o.priceDeltaInr })),
        },
      })),
      // params are kept here for the pricing engine; the public catalog hides them
      rules: m.rules.map((r) => ({ id: r.id, label: r.label, type: r.type, params: r.params })),
    },
  ];
}

/**
 * Loads every active model from the database. Inactive options, rules and models are left
 * out, so the pricing engine treats them as "not available". Options keep insertion order.
 */
async function loadCatalogs() {
  const models = await prisma.shoeModel.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
    include: {
      parts: {
        orderBy: { sortOrder: 'asc' },
        include: { options: { where: { isActive: true }, orderBy: { id: 'asc' } } },
      },
      rules: { where: { isActive: true }, orderBy: { id: 'asc' } },
    },
  });
  return new Map(models.map(toInternalCatalog));
}

/** Cached for 60 s. Concurrent callers share one load, and a failed load is not cached. */
function catalogs() {
  if (!cache || Date.now() - cache.at > CACHE_MS) {
    const entry = { at: Date.now(), promise: loadCatalogs() };
    entry.promise.catch(() => {
      if (cache === entry) cache = null;
    });
    cache = entry;
  }
  return cache.promise;
}

/** Forgets the cached catalog so the next read hits the database (used after price edits and in tests). */
export function clearCatalogCache() {
  cache = null;
}

/**
 * Loads the catalog ahead of the first request (a cold start is slow on a free host).
 * Never throws: a failure is logged and the first real request simply tries again.
 */
export async function warmCatalogCache() {
  try {
    await catalogs();
  } catch (err) {
    console.error('Catalog warm-up failed:', err.message);
  }
}

/**
 * Internal catalog for pricing (includes rule params).
 * @param {string} modelId
 * @throws {AppError} 404 when the model does not exist or is inactive
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
    model: { ...c.model },
    parts: c.parts,
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
