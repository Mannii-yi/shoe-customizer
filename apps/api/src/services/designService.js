import { randomBytes } from 'node:crypto';
import { prisma } from '../db.js';
import { getInternalCatalog } from './catalogService.js';
import { calculateQuote } from './pricing.js';
import { notFound } from '../utils/errors.js';

/**
 * The only fields that leave the server. userId is never included,
 * so the public shared view cannot leak who owns a design.
 */
export function toDesign(row) {
  return {
    id: row.id,
    modelId: row.modelId,
    name: row.name,
    configuration: row.configuration,
    priceInr: row.priceInr,
    thumbnailDataUrl: row.thumbnailDataUrl,
    shareToken: row.shareToken,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Prices a configuration on the server. Throws 404 (unknown model) or 422 (invalid configuration). */
async function priceConfiguration(modelId, configuration) {
  const catalog = await getInternalCatalog(modelId);
  return calculateQuote(catalog, configuration).totalInr;
}

/** Finds a design owned by this user. Someone else's design is "not found", never "forbidden". */
async function findOwned(userId, id) {
  const row = await prisma.design.findFirst({ where: { id, userId } });
  if (!row) throw notFound('Design not found');
  return row;
}

/** @param {string} userId @param {{modelId:string,name:string,configuration:object,thumbnailDataUrl?:string}} input */
export async function createDesign(userId, { modelId, name, configuration, thumbnailDataUrl }) {
  const priceInr = await priceConfiguration(modelId, configuration);
  const row = await prisma.design.create({
    data: { userId, modelId, name, configuration, priceInr, thumbnailDataUrl: thumbnailDataUrl ?? null },
  });
  return toDesign(row);
}

export async function listDesigns(userId) {
  const rows = await prisma.design.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
  return rows.map(toDesign);
}

export async function getDesign(userId, id) {
  return toDesign(await findOwned(userId, id));
}

/**
 * The price is re-snapshotted whenever the configuration changes.
 * Renaming or changing only the thumbnail keeps the saved price.
 */
export async function updateDesign(userId, id, { name, configuration, thumbnailDataUrl }) {
  const existing = await findOwned(userId, id);
  const data = {};
  if (name !== undefined) data.name = name;
  if (thumbnailDataUrl !== undefined) data.thumbnailDataUrl = thumbnailDataUrl;
  if (configuration !== undefined) {
    data.priceInr = await priceConfiguration(existing.modelId, configuration);
    data.configuration = configuration;
  }
  return toDesign(await prisma.design.update({ where: { id: existing.id }, data }));
}

/** Also removes the design from any carts (database cascade). Past orders keep their own snapshot. */
export async function deleteDesign(userId, id) {
  const { count } = await prisma.design.deleteMany({ where: { id, userId } });
  if (count === 0) throw notFound('Design not found');
}

/** Creates a share token once; later calls return the same one. */
export async function shareDesign(userId, id) {
  const existing = await findOwned(userId, id);
  let token = existing.shareToken;
  if (!token) {
    token = randomBytes(16).toString('base64url'); // 128 random bits, not guessable
    await prisma.design.update({ where: { id: existing.id }, data: { shareToken: token } });
  }
  return { shareToken: token, sharePath: `/shared/${token}` };
}

/** Public read-only view. No owner information. */
export async function getSharedDesign(token) {
  const row = await prisma.design.findUnique({ where: { shareToken: token } });
  if (!row) throw notFound('Shared design not found');
  return toDesign(row);
}
