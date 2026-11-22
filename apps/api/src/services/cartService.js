import { prisma } from '../db.js';
import { getInternalCatalog } from './catalogService.js';
import { calculateQuote, InvalidConfigurationError } from './pricing.js';
import { AppError, notFound } from '../utils/errors.js';

export const MAX_QUANTITY = 5;

/**
 * Prices a saved design against the CURRENT catalog (not the price saved with it).
 * @throws {InvalidConfigurationError} when the design no longer matches the catalog
 * @throws {AppError} 404 when its model no longer exists
 */
export async function quoteDesign(design) {
  const catalog = await getInternalCatalog(design.modelId);
  return calculateQuote(catalog, design.configuration);
}

/** Like quoteDesign, but returns null instead of throwing when the design is no longer valid. */
async function tryQuoteDesign(design) {
  try {
    return await quoteDesign(design);
  } catch (err) {
    if (err instanceof InvalidConfigurationError) return null;
    if (err instanceof AppError && err.status === 404) return null;
    throw err;
  }
}

/**
 * The cart with every price recomputed from the current catalog, so it is always honest.
 * An item whose design no longer matches the catalog is returned with unavailable: true,
 * a price of 0, and is left out of the subtotal (checkout refuses to go through with it).
 */
export async function getCart(userId) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { design: true }, orderBy: { id: 'asc' } } },
  });

  const items = [];
  let subtotalInr = 0;
  for (const row of cart?.items ?? []) {
    const quote = await tryQuoteDesign(row.design);
    const unitPriceInr = quote ? quote.totalInr : 0;
    const lineTotalInr = unitPriceInr * row.quantity;
    subtotalInr += lineTotalInr;
    items.push({
      id: row.id,
      design: {
        id: row.design.id,
        name: row.design.name,
        modelId: row.design.modelId,
        configuration: row.design.configuration,
        thumbnailDataUrl: row.design.thumbnailDataUrl,
      },
      sizeEu: row.sizeEu,
      quantity: row.quantity,
      unitPriceInr,
      lineTotalInr,
      ...(quote ? {} : { unavailable: true }),
    });
  }
  return { items, subtotalInr };
}

/**
 * Adds a design. The same design in the same size merges into one line
 * (quantities add up, capped at 5).
 * @throws {AppError} 404 when the design is not the user's
 */
export async function addItem(userId, { designId, sizeEu, quantity }) {
  const design = await prisma.design.findFirst({ where: { id: designId, userId }, select: { id: true } });
  if (!design) throw notFound('Design not found');

  const cart = await prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });

  await prisma.$transaction(async (tx) => {
    const item = await tx.cartItem.upsert({
      where: { cartId_designId_sizeEu: { cartId: cart.id, designId, sizeEu } },
      update: { quantity: { increment: quantity } },
      create: { cartId: cart.id, designId, sizeEu, quantity },
    });
    if (item.quantity > MAX_QUANTITY) {
      await tx.cartItem.update({ where: { id: item.id }, data: { quantity: MAX_QUANTITY } });
    }
  });
  return getCart(userId);
}

/**
 * Changes quantity and/or size. If the new size already exists for the same design,
 * the two lines merge (quantities add up, capped at 5).
 * @throws {AppError} 404 when the item is not in the user's cart
 */
export async function updateItem(userId, id, { quantity, sizeEu }) {
  const item = await prisma.cartItem.findFirst({ where: { id, cart: { userId } } });
  if (!item) throw notFound('Cart item not found');

  const newQuantity = quantity ?? item.quantity;
  const newSize = sizeEu ?? item.sizeEu;

  await prisma.$transaction(async (tx) => {
    const clash =
      newSize !== item.sizeEu
        ? await tx.cartItem.findUnique({
            where: { cartId_designId_sizeEu: { cartId: item.cartId, designId: item.designId, sizeEu: newSize } },
          })
        : null;
    if (clash) {
      await tx.cartItem.update({
        where: { id: clash.id },
        data: { quantity: Math.min(MAX_QUANTITY, clash.quantity + newQuantity) },
      });
      await tx.cartItem.delete({ where: { id: item.id } });
    } else {
      await tx.cartItem.update({ where: { id: item.id }, data: { quantity: newQuantity, sizeEu: newSize } });
    }
  });
  return getCart(userId);
}

/** @throws {AppError} 404 when the item is not in the user's cart */
export async function removeItem(userId, id) {
  const { count } = await prisma.cartItem.deleteMany({ where: { id, cart: { userId } } });
  if (count === 0) throw notFound('Cart item not found');
  return getCart(userId);
}
