import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';

process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';

const api = '/api/v1';
const app = createApp({ rateLimits: { auth: 1000, general: 1000 } });
const hasDb = Boolean(process.env.DATABASE_URL);
const password = 'correct-horse-9';
const PREFIX = 'test+shop-';

const address = {
  fullName: 'Asha Rao',
  phone: '9876543210',
  line1: '12 MG Road',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411001',
};

const auth = (t) => ({ Authorization: `Bearer ${t}` });

async function newUser() {
  const email = `${PREFIX}${randomUUID()}@example.com`;
  const res = await request(app).post(`${api}/auth/register`).send({ name: 'Shopper', email, password });
  return res.body.token;
}
async function defaultConfig() {
  const res = await request(app).get(`${api}/models/runner-01/catalog`);
  return structuredClone(res.body.model.defaultConfiguration);
}
async function makeDesign(token, { leather = false, name = 'Shoe' } = {}) {
  const configuration = await defaultConfig();
  if (leather) configuration.parts.upper.materialId = 'leather';
  const res = await request(app).post(`${api}/designs`).set(auth(token)).send({ modelId: 'runner-01', name, configuration });
  return res.body.design; // 5999, or 6899 with a leather upper
}
const addToCart = (token, body) => request(app).post(`${api}/cart/items`).set(auth(token)).send(body);
const getCart = async (token) => (await request(app).get(`${api}/cart`).set(auth(token))).body;
const checkout = (token, body = { shippingAddress: address, paymentMethod: 'MOCK' }) =>
  request(app).post(`${api}/orders/checkout`).set(auth(token)).send(body);

afterAll(async () => {
  if (hasDb) {
    // Orders are not deleted with their user (history), so remove them first.
    await prisma.order.deleteMany({ where: { user: { email: { startsWith: PREFIX } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
  }
  await prisma.$disconnect();
});

describe('cart and orders without a database', () => {
  const calls = [
    ['get', '/cart'],
    ['post', '/cart/items'],
    ['patch', '/cart/items/abc'],
    ['delete', '/cart/items/abc'],
    ['post', '/orders/checkout'],
    ['get', '/orders'],
    ['get', '/orders/abc'],
  ];
  it.each(calls)('%s %s requires login', async (method, path) => {
    const res = await request(app)[method](`${api}${path}`).send({});
    expect(res.status).toBe(401);
  });
});

describe.skipIf(!hasDb)('cart', () => {
  let token;
  let other;
  beforeAll(async () => {
    const model = await prisma.shoeModel.findUnique({ where: { id: 'runner-01' } });
    if (!model) throw new Error('Model "runner-01" is not in the database. Run: npm run db:seed');
    token = await newUser();
    other = await newUser();
  });

  it('a new user has an empty cart', async () => {
    expect(await getCart(await newUser())).toEqual({ items: [], subtotalInr: 0 });
  });

  it('adds a design with server-calculated prices', async () => {
    const t = await newUser();
    const design = await makeDesign(t, { leather: true });
    const res = await addToCart(t, { designId: design.id, sizeEu: 42, quantity: 2 });
    expect(res.status).toBe(201);
    const [item] = res.body.cart.items;
    expect(item).toMatchObject({ sizeEu: 42, quantity: 2, unitPriceInr: 6899, lineTotalInr: 13798 });
    expect(item.design).toMatchObject({ id: design.id, name: 'Shoe', modelId: 'runner-01' });
    expect(res.body.cart.subtotalInr).toBe(13798);
  });

  it('merges the same design and size, and caps the quantity at 5', async () => {
    const t = await newUser();
    const d = await makeDesign(t);
    await addToCart(t, { designId: d.id, sizeEu: 40, quantity: 2 });
    const merged = await addToCart(t, { designId: d.id, sizeEu: 40, quantity: 2 });
    expect(merged.body.cart.items).toHaveLength(1);
    expect(merged.body.cart.items[0].quantity).toBe(4);
    const capped = await addToCart(t, { designId: d.id, sizeEu: 40, quantity: 3 });
    expect(capped.body.cart.items[0].quantity).toBe(5);
  });

  it('keeps different sizes as separate lines', async () => {
    const t = await newUser();
    const d = await makeDesign(t);
    await addToCart(t, { designId: d.id, sizeEu: 40, quantity: 1 });
    const res = await addToCart(t, { designId: d.id, sizeEu: 41, quantity: 1 });
    expect(res.body.cart.items).toHaveLength(2);
    expect(res.body.cart.subtotalInr).toBe(5999 * 2);
  });

  it.each([
    ['size too small', { sizeEu: 35, quantity: 1 }],
    ['size too large', { sizeEu: 47, quantity: 1 }],
    ['size not a whole number', { sizeEu: 40.5, quantity: 1 }],
    ['size sent as text', { sizeEu: '40', quantity: 1 }],
    ['quantity 0', { sizeEu: 40, quantity: 0 }],
    ['quantity 6', { sizeEu: 40, quantity: 6 }],
    ['missing quantity', { sizeEu: 40 }],
  ])('rejects %s with 400', async (_label, body) => {
    const d = await makeDesign(token);
    const res = await addToCart(token, { designId: d.id, ...body });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a missing designId with 400', async () => {
    expect((await addToCart(token, { sizeEu: 40, quantity: 1 })).status).toBe(400);
  });

  it("cannot add someone else's design or an unknown one (404)", async () => {
    const theirs = await makeDesign(other);
    expect((await addToCart(token, { designId: theirs.id, sizeEu: 40, quantity: 1 })).status).toBe(404);
    expect((await addToCart(token, { designId: randomUUID(), sizeEu: 40, quantity: 1 })).status).toBe(404);
  });

  it("carts are private: another user's cart does not show my items", async () => {
    const a = await newUser();
    const b = await newUser();
    const d = await makeDesign(a);
    await addToCart(a, { designId: d.id, sizeEu: 40, quantity: 1 });
    expect((await getCart(b)).items).toEqual([]);
  });

  it('recomputes prices from the current catalog, not the saved price', async () => {
    const t = await newUser();
    const d = await makeDesign(t); // saved at 5999
    await addToCart(t, { designId: d.id, sizeEu: 40, quantity: 1 });
    const cfg = await defaultConfig();
    cfg.parts.upper.materialId = 'leather';
    await prisma.design.update({ where: { id: d.id }, data: { configuration: cfg } }); // saved priceInr stays 5999
    expect((await getCart(t)).items[0].unitPriceInr).toBe(6899);
  });

  it('flags an item that no longer matches the catalog and leaves it out of the subtotal', async () => {
    const t = await newUser();
    const good = await makeDesign(t);
    const bad = await makeDesign(t);
    await addToCart(t, { designId: good.id, sizeEu: 40, quantity: 1 });
    await addToCart(t, { designId: bad.id, sizeEu: 41, quantity: 1 });
    const cfg = await defaultConfig();
    cfg.parts.upper.materialId = 'glitter';
    await prisma.design.update({ where: { id: bad.id }, data: { configuration: cfg } });
    const cart = await getCart(t);
    const flagged = cart.items.find((i) => i.design.id === bad.id);
    expect(flagged).toMatchObject({ unavailable: true, unitPriceInr: 0, lineTotalInr: 0 });
    expect(cart.subtotalInr).toBe(5999);
  });

  it('deleting a design removes it from carts', async () => {
    const t = await newUser();
    const d = await makeDesign(t);
    await addToCart(t, { designId: d.id, sizeEu: 40, quantity: 1 });
    await request(app).delete(`${api}/designs/${d.id}`).set(auth(t));
    expect((await getCart(t)).items).toEqual([]);
  });

  describe('changing items', () => {
    it('changes the quantity', async () => {
      const t = await newUser();
      const d = await makeDesign(t);
      const { items } = (await addToCart(t, { designId: d.id, sizeEu: 40, quantity: 1 })).body.cart;
      const res = await request(app).patch(`${api}/cart/items/${items[0].id}`).set(auth(t)).send({ quantity: 3 });
      expect(res.status).toBe(200);
      expect(res.body.cart.items[0].quantity).toBe(3);
      expect(res.body.cart.subtotalInr).toBe(5999 * 3);
    });

    it('changes the size', async () => {
      const t = await newUser();
      const d = await makeDesign(t);
      const { items } = (await addToCart(t, { designId: d.id, sizeEu: 40, quantity: 2 })).body.cart;
      const res = await request(app).patch(`${api}/cart/items/${items[0].id}`).set(auth(t)).send({ sizeEu: 44 });
      expect(res.body.cart.items).toHaveLength(1);
      expect(res.body.cart.items[0]).toMatchObject({ sizeEu: 44, quantity: 2 });
    });

    it('merges lines when the new size already exists (capped at 5)', async () => {
      const t = await newUser();
      const d = await makeDesign(t);
      await addToCart(t, { designId: d.id, sizeEu: 40, quantity: 3 });
      const { items } = (await addToCart(t, { designId: d.id, sizeEu: 41, quantity: 4 })).body.cart;
      const size41 = items.find((i) => i.sizeEu === 41);
      const res = await request(app).patch(`${api}/cart/items/${size41.id}`).set(auth(t)).send({ sizeEu: 40 });
      expect(res.body.cart.items).toHaveLength(1);
      expect(res.body.cart.items[0]).toMatchObject({ sizeEu: 40, quantity: 5 });
    });

    it("cannot change someone else's item (404), and rejects an empty update (400)", async () => {
      const t = await newUser();
      const d = await makeDesign(t);
      const { items } = (await addToCart(t, { designId: d.id, sizeEu: 40, quantity: 1 })).body.cart;
      expect((await request(app).patch(`${api}/cart/items/${items[0].id}`).set(auth(other)).send({ quantity: 5 })).status).toBe(404);
      expect((await request(app).patch(`${api}/cart/items/${items[0].id}`).set(auth(t)).send({})).status).toBe(400);
      expect((await getCart(t)).items[0].quantity).toBe(1);
    });

    it('removes an item; cannot remove someone else\'s (404, and it survives)', async () => {
      const t = await newUser();
      const d = await makeDesign(t);
      const { items } = (await addToCart(t, { designId: d.id, sizeEu: 40, quantity: 1 })).body.cart;
      expect((await request(app).delete(`${api}/cart/items/${items[0].id}`).set(auth(other))).status).toBe(404);
      expect((await getCart(t)).items).toHaveLength(1);
      const res = await request(app).delete(`${api}/cart/items/${items[0].id}`).set(auth(t));
      expect(res.status).toBe(200);
      expect(res.body.cart).toEqual({ items: [], subtotalInr: 0 });
    });
  });
});

describe.skipIf(!hasDb)('checkout and orders', () => {
  beforeAll(async () => {
    const model = await prisma.shoeModel.findUnique({ where: { id: 'runner-01' } });
    if (!model) throw new Error('Model "runner-01" is not in the database. Run: npm run db:seed');
  });

  it('an empty cart returns 409', async () => {
    const res = await checkout(await newUser());
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('creates a PAID_MOCK order with server prices and shipping of 99, then empties the cart', async () => {
    const t = await newUser();
    const plain = await makeDesign(t);
    const leather = await makeDesign(t, { leather: true });
    await addToCart(t, { designId: plain.id, sizeEu: 40, quantity: 2 });
    await addToCart(t, { designId: leather.id, sizeEu: 42, quantity: 1 });

    const res = await checkout(t);
    expect(res.status).toBe(201);
    const { order } = res.body;
    expect(order).toMatchObject({
      status: 'PAID_MOCK',
      subtotalInr: 5999 * 2 + 6899,
      shippingInr: 99,
      totalInr: 5999 * 2 + 6899 + 99,
      shippingAddress: address,
    });
    expect(order.items).toHaveLength(2);
    const leatherLine = order.items.find((i) => i.unitPriceInr === 6899);
    expect(leatherLine).toMatchObject({ designId: leather.id, modelId: 'runner-01', sizeEu: 42, quantity: 1 });
    expect(leatherLine.lines).toEqual([{ type: 'OPTION', partKey: 'upper', label: 'Upper: Leather', amountInr: 900 }]);
    expect(leatherLine.configuration.parts.upper.materialId).toBe('leather');

    expect(await getCart(t)).toEqual({ items: [], subtotalInr: 0 });
  });

  it('ignores prices, totals and status sent by the client', async () => {
    const t = await newUser();
    const d = await makeDesign(t);
    await addToCart(t, { designId: d.id, sizeEu: 40, quantity: 1 });
    const res = await checkout(t, {
      shippingAddress: address,
      paymentMethod: 'MOCK',
      subtotalInr: 1,
      shippingInr: 0,
      totalInr: 1,
      status: 'CANCELLED',
      items: [{ unitPriceInr: 1 }],
    });
    expect(res.status).toBe(201);
    expect(res.body.order).toMatchObject({ subtotalInr: 5999, shippingInr: 99, totalInr: 6098, status: 'PAID_MOCK' });
  });

  it.each([
    ['phone with 9 digits', { phone: '987654321' }],
    ['phone with letters', { phone: '98765abcde' }],
    ['pincode with 5 digits', { pincode: '41100' }],
    ['missing city', { city: undefined }],
    ['empty name', { fullName: '' }],
  ])('rejects %s with 400 and leaves the cart alone', async (_label, change) => {
    const t = await newUser();
    const d = await makeDesign(t);
    await addToCart(t, { designId: d.id, sizeEu: 40, quantity: 1 });
    const res = await checkout(t, { shippingAddress: { ...address, ...change }, paymentMethod: 'MOCK' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect((await getCart(t)).items).toHaveLength(1);
  });

  it('rejects a payment method other than MOCK', async () => {
    const t = await newUser();
    const res = await checkout(t, { shippingAddress: address, paymentMethod: 'CARD' });
    expect(res.status).toBe(400);
  });

  it('all or nothing: one invalid item returns 422, no order is created, the cart is untouched', async () => {
    const t = await newUser();
    const good = await makeDesign(t);
    const bad = await makeDesign(t);
    await addToCart(t, { designId: good.id, sizeEu: 40, quantity: 1 });
    await addToCart(t, { designId: bad.id, sizeEu: 41, quantity: 1 });
    const cfg = await defaultConfig();
    cfg.parts.upper.colorId = 'pink';
    await prisma.design.update({ where: { id: bad.id }, data: { configuration: cfg } });

    const res = await checkout(t);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_CONFIGURATION');
    expect(res.body.error.details[0]).toMatchObject({ partKey: 'upper', field: 'colorId' });

    const list = await request(app).get(`${api}/orders`).set(auth(t));
    expect(list.body.orders).toEqual([]);
    expect((await getCart(t)).items).toHaveLength(2);
  });

  it('a double submit creates exactly one order', async () => {
    const t = await newUser();
    const d = await makeDesign(t);
    await addToCart(t, { designId: d.id, sizeEu: 40, quantity: 1 });
    const [a, b] = await Promise.all([checkout(t), checkout(t)]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    const list = await request(app).get(`${api}/orders`).set(auth(t));
    expect(list.body.orders).toHaveLength(1);
  });

  // Proves the cart lock deterministically with only 2-3 database connections, so it does not
  // depend on firing a crowd of requests at a connection pooler. While one transaction holds
  // the cart lock, a checkout must WAIT on that lock. Without the lock in checkout() it would
  // not wait, and could create a second order from the same cart.
  it('checkout waits on the cart lock, so a second checkout cannot slip in', async () => {
    const t = await newUser();
    const d = await makeDesign(t);
    await addToCart(t, { designId: d.id, sizeEu: 40, quantity: 1 });
    const me = await request(app).get(`${api}/auth/me`).set(auth(t));
    const cart = await prisma.cart.findUnique({ where: { userId: me.body.user.id } });

    const blockedOnCartLock = async () => {
      const rows = await prisma.$queryRaw`
        SELECT count(*)::int AS n FROM pg_stat_activity
        WHERE wait_event_type = 'Lock' AND datname = current_database() AND query LIKE '%"carts"%'`;
      return rows[0].n > 0;
    };

    let pending;
    await prisma.$transaction(
      async (tx) => {
        // Play a first checkout that is half way through: it holds the cart lock.
        await tx.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
        // .then() is what actually fires a supertest request (they are lazy)
        pending = checkout(t).then((r) => r); // the second checkout starts now
        let waited = false;
        for (let i = 0; i < 150 && !waited; i++) {
          waited = await blockedOnCartLock();
          if (!waited) await new Promise((r) => setTimeout(r, 200));
        }
        expect(waited, 'the second checkout should be blocked waiting for the cart lock').toBe(true);
        // The first checkout finishes: its order used up the cart.
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      },
      { timeout: 60_000, maxWait: 60_000 },
    );

    const res = await pending;
    expect(res.status).toBe(409); // woke up, found the cart empty
    const list = await request(app).get(`${api}/orders`).set(auth(t));
    expect(list.body.orders).toEqual([]);
  });

  it('the order keeps its own snapshot when the design is later changed or deleted', async () => {
    const t = await newUser();
    const d = await makeDesign(t);
    await addToCart(t, { designId: d.id, sizeEu: 40, quantity: 1 });
    const { order } = (await checkout(t)).body;

    await request(app).patch(`${api}/designs/${d.id}`).set(auth(t)).send({ name: 'Changed later' });
    await request(app).delete(`${api}/designs/${d.id}`).set(auth(t));

    const res = await request(app).get(`${api}/orders/${order.id}`).set(auth(t));
    expect(res.status).toBe(200);
    expect(res.body.order.items[0]).toMatchObject({ designId: null, unitPriceInr: 5999, modelId: 'runner-01' });
    expect(res.body.order.items[0].configuration.parts.upper.materialId).toBe('mesh');
  });

  it('lists my orders newest first, and orders are private', async () => {
    const t = await newUser();
    const stranger = await newUser();
    const d = await makeDesign(t);
    await addToCart(t, { designId: d.id, sizeEu: 40, quantity: 1 });
    const first = (await checkout(t)).body.order;
    await addToCart(t, { designId: d.id, sizeEu: 41, quantity: 1 });
    const second = (await checkout(t)).body.order;

    const list = await request(app).get(`${api}/orders`).set(auth(t));
    expect(list.body.orders.map((o) => o.id)).toEqual([second.id, first.id]);

    expect((await request(app).get(`${api}/orders/${first.id}`).set(auth(stranger))).status).toBe(404);
    expect((await request(app).get(`${api}/orders`).set(auth(stranger))).body.orders).toEqual([]);
    expect((await request(app).get(`${api}/orders/${randomUUID()}`).set(auth(t))).status).toBe(404);
  });
});
