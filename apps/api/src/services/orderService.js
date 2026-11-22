import { prisma } from '../db.js';
import { quoteDesign } from './cartService.js';
import { conflict, notFound } from '../utils/errors.js';

export const SHIPPING_INR = 99; // flat, MOCK: no real shipping rules in this build

/** Maps a database order (with items) to the API shape. */
export function toOrder(row) {
  return {
    id: row.id,
    status: row.status,
    items: row.items.map((i) => ({
      id: i.id,
      designId: i.designId,
      modelId: i.modelId,
      configuration: i.configuration,
      sizeEu: i.sizeEu,
      quantity: i.quantity,
      unitPriceInr: i.unitPriceInr,
      lines: i.lines,
    })),
    subtotalInr: row.subtotalInr,
    shippingInr: row.shippingInr,
    totalInr: row.totalInr,
    shippingAddress: row.shippingAddress,
    createdAt: row.createdAt,
  };
}

const withItems = { items: { orderBy: { id: 'asc' } } };

/**
 * MOCK checkout (no real payment). Everything happens in ONE database transaction:
 * lock the cart, re-price every item from the current catalog, snapshot the configuration
 * and price lines, save the order as PAID_MOCK, and empty the cart. If anything fails
 * (for example an item that is no longer valid), nothing is saved and the cart is untouched.
 * @param {string} userId
 * @param {{shippingAddress: object}} input prices from the client are never read
 * @throws {AppError} 409 when the cart is empty
 * @throws {InvalidConfigurationError} 422 when an item no longer matches the catalog
 */
export async function checkout(userId, { shippingAddress }) {
  const order = await prisma.$transaction(
    async (tx) => {
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (!cart) throw conflict('Your cart is empty');

      // Touching the cart row locks it. A second checkout fired at the same moment waits here,
      // then finds the cart already emptied and gets 409, so a double click cannot order twice.
      await tx.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });

      const rows = await tx.cartItem.findMany({
        where: { cartId: cart.id },
        include: { design: true },
        orderBy: { id: 'asc' },
      });
      if (rows.length === 0) throw conflict('Your cart is empty');

      let subtotalInr = 0;
      const items = [];
      for (const row of rows) {
        const quote = await quoteDesign(row.design); // throws 422 if no longer valid
        subtotalInr += quote.totalInr * row.quantity;
        items.push({
          designId: row.designId,
          modelId: row.design.modelId,
          configuration: row.design.configuration,
          sizeEu: row.sizeEu,
          quantity: row.quantity,
          unitPriceInr: quote.totalInr,
          lines: quote.lines,
        });
      }

      const created = await tx.order.create({
        data: {
          userId,
          status: 'PAID_MOCK',
          subtotalInr,
          shippingInr: SHIPPING_INR,
          totalInr: subtotalInr + SHIPPING_INR,
          shippingAddress,
          items: { create: items },
        },
        include: withItems,
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    },
    { timeout: 15_000, maxWait: 10_000 }, // generous: a remote database adds latency per query
  );
  return toOrder(order);
}

/** Own orders, newest first. */
export async function listOrders(userId) {
  const rows = await prisma.order.findMany({
    where: { userId },
    include: withItems,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toOrder);
}

/** @throws {AppError} 404 for another user's order (never 403) */
export async function getOrder(userId, id) {
  const row = await prisma.order.findFirst({ where: { id, userId }, include: withItems });
  if (!row) throw notFound('Order not found');
  return toOrder(row);
}
