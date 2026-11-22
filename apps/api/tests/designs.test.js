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

// Smallest valid image data URLs. Real thumbnails are larger, the rules are the same.
const tinyJpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=';

let ownerToken;
let otherToken;

async function register() {
  const email = `test+designs-${randomUUID()}@example.com`;
  const res = await request(app).post(`${api}/auth/register`).send({ name: 'Tester', email, password });
  return res.body.token;
}
const auth = (token) => ({ Authorization: `Bearer ${token}` });

async function defaultConfig() {
  const res = await request(app).get(`${api}/models/runner-01/catalog`);
  return structuredClone(res.body.model.defaultConfiguration);
}
async function leatherConfig() {
  const cfg = await defaultConfig();
  cfg.parts.upper.materialId = 'leather';
  return cfg;
}
async function saveDesign(token, overrides = {}) {
  const res = await request(app)
    .post(`${api}/designs`)
    .set(auth(token))
    .send({ modelId: 'runner-01', name: 'My shoe', configuration: await defaultConfig(), ...overrides });
  return res;
}

afterAll(async () => {
  if (hasDb) await prisma.user.deleteMany({ where: { email: { startsWith: 'test+designs-' } } });
  await prisma.$disconnect();
});

describe('designs without a database', () => {
  const calls = [
    ['get', '/designs'],
    ['post', '/designs'],
    ['get', '/designs/abc'],
    ['patch', '/designs/abc'],
    ['delete', '/designs/abc'],
    ['post', '/designs/abc/share'],
  ];
  it.each(calls)('%s %s requires login', async (method, path) => {
    const res = await request(app)[method](`${api}${path}`).send({});
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe.skipIf(!hasDb)('designs with the database', () => {
  beforeAll(async () => {
    const model = await prisma.shoeModel.findUnique({ where: { id: 'runner-01' } });
    if (!model) throw new Error('Model "runner-01" is not in the database. Run: npm run db:seed');
    ownerToken = await register();
    otherToken = await register();
  });

  describe('create', () => {
    it('saves a design and snapshots the server price', async () => {
      const res = await saveDesign(ownerToken, { configuration: await leatherConfig(), thumbnailDataUrl: tinyJpeg });
      expect(res.status).toBe(201);
      expect(res.body.design).toMatchObject({
        modelId: 'runner-01',
        name: 'My shoe',
        priceInr: 5999 + 900,
        thumbnailDataUrl: tinyJpeg,
        shareToken: null,
      });
      expect(res.body.design.id).toEqual(expect.any(String));
      expect(res.body.design).not.toHaveProperty('userId');
    });

    it('ignores a price (and other fields) sent by the client', async () => {
      const res = await saveDesign(ownerToken, { priceInr: 1, userId: 'someone-else', shareToken: 'hacked' });
      expect(res.status).toBe(201);
      expect(res.body.design.priceInr).toBe(5999);
      expect(res.body.design.shareToken).toBeNull();
    });

    it('trims the name', async () => {
      const res = await saveDesign(ownerToken, { name: '  Spaced  ' });
      expect(res.body.design.name).toBe('Spaced');
    });

    it('rejects an invalid configuration with 422 and details', async () => {
      const cfg = await defaultConfig();
      cfg.parts.upper.colorId = 'pink';
      const res = await saveDesign(ownerToken, { configuration: cfg });
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_CONFIGURATION');
      expect(res.body.error.details[0]).toMatchObject({ partKey: 'upper', field: 'colorId' });
    });

    it('returns 404 for an unknown model', async () => {
      const res = await saveDesign(ownerToken, { modelId: 'nope' });
      expect(res.status).toBe(404);
    });

    it.each([
      ['empty name', { name: '' }],
      ['missing name', { name: undefined }],
      ['name too long', { name: 'x'.repeat(81) }],
      ['thumbnail with the wrong type', { thumbnailDataUrl: 'data:text/html;base64,PGgxPg==' }],
      ['thumbnail that is not a data URL', { thumbnailDataUrl: 'https://example.com/a.jpg' }],
      ['thumbnail over 150 KB', { thumbnailDataUrl: `data:image/jpeg;base64,${'A'.repeat(210_000 - 23)}` }],
      ['thumbnail just over the 150 KB image limit', { thumbnailDataUrl: `data:image/jpeg;base64,${'A'.repeat(204_804)}` }],
    ])('rejects %s with 400', async (_label, overrides) => {
      const res = await saveDesign(ownerToken, overrides);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('accepts a thumbnail right at the 150 KB image limit', async () => {
      // 204,800 base64 characters decode to exactly 153,600 bytes (150 KB)
      const res = await saveDesign(ownerToken, { thumbnailDataUrl: `data:image/jpeg;base64,${'A'.repeat(204_800)}` });
      expect(res.status).toBe(201);
    });
  });

  describe('list and get', () => {
    it('lists only my own designs', async () => {
      const mine = (await saveDesign(ownerToken, { name: 'owner-only' })).body.design;
      const theirs = (await saveDesign(otherToken, { name: 'other-only' })).body.design;
      const ownerList = await request(app).get(`${api}/designs`).set(auth(ownerToken));
      const ids = ownerList.body.designs.map((d) => d.id);
      expect(ownerList.status).toBe(200);
      expect(ids).toContain(mine.id);
      expect(ids).not.toContain(theirs.id);
    });

    it('gets my design', async () => {
      const made = (await saveDesign(ownerToken)).body.design;
      const res = await request(app).get(`${api}/designs/${made.id}`).set(auth(ownerToken));
      expect(res.status).toBe(200);
      expect(res.body.design.id).toBe(made.id);
    });

    it("returns 404 (not 403) for someone else's design", async () => {
      const made = (await saveDesign(ownerToken)).body.design;
      const res = await request(app).get(`${api}/designs/${made.id}`).set(auth(otherToken));
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 404 for an unknown or malformed id', async () => {
      for (const id of [randomUUID(), 'not-a-uuid']) {
        const res = await request(app).get(`${api}/designs/${id}`).set(auth(ownerToken));
        expect(res.status).toBe(404);
      }
    });
  });

  describe('update', () => {
    it('renaming keeps the saved price', async () => {
      const made = (await saveDesign(ownerToken, { configuration: await leatherConfig() })).body.design;
      const res = await request(app).patch(`${api}/designs/${made.id}`).set(auth(ownerToken)).send({ name: 'Renamed' });
      expect(res.status).toBe(200);
      expect(res.body.design.name).toBe('Renamed');
      expect(res.body.design.priceInr).toBe(6899);
    });

    it('changing the configuration re-snapshots the price', async () => {
      const made = (await saveDesign(ownerToken)).body.design;
      const res = await request(app)
        .patch(`${api}/designs/${made.id}`)
        .set(auth(ownerToken))
        .send({ configuration: await leatherConfig() });
      expect(res.status).toBe(200);
      expect(res.body.design.priceInr).toBe(6899);
      expect(res.body.design.configuration.parts.upper.materialId).toBe('leather');
    });

    it('an invalid new configuration returns 422 and leaves the design unchanged', async () => {
      const made = (await saveDesign(ownerToken)).body.design;
      const bad = await defaultConfig();
      bad.parts.upper.materialId = 'glitter';
      const res = await request(app).patch(`${api}/designs/${made.id}`).set(auth(ownerToken)).send({ configuration: bad });
      expect(res.status).toBe(422);
      const after = await request(app).get(`${api}/designs/${made.id}`).set(auth(ownerToken));
      expect(after.body.design.priceInr).toBe(5999);
      expect(after.body.design.configuration.parts.upper.materialId).toBe('mesh');
    });

    it('ignores an attempt to set the price directly', async () => {
      const made = (await saveDesign(ownerToken)).body.design;
      const res = await request(app).patch(`${api}/designs/${made.id}`).set(auth(ownerToken)).send({ name: 'X', priceInr: 1 });
      expect(res.body.design.priceInr).toBe(5999);
    });

    it('rejects an empty update with 400', async () => {
      const made = (await saveDesign(ownerToken)).body.design;
      const res = await request(app).patch(`${api}/designs/${made.id}`).set(auth(ownerToken)).send({});
      expect(res.status).toBe(400);
    });

    it("cannot update someone else's design (404) and changes nothing", async () => {
      const made = (await saveDesign(ownerToken, { name: 'keep me' })).body.design;
      const res = await request(app).patch(`${api}/designs/${made.id}`).set(auth(otherToken)).send({ name: 'stolen' });
      expect(res.status).toBe(404);
      const after = await request(app).get(`${api}/designs/${made.id}`).set(auth(ownerToken));
      expect(after.body.design.name).toBe('keep me');
    });
  });

  describe('delete', () => {
    it('deletes my design (204) and it is gone', async () => {
      const made = (await saveDesign(ownerToken)).body.design;
      const del = await request(app).delete(`${api}/designs/${made.id}`).set(auth(ownerToken));
      expect(del.status).toBe(204);
      const get = await request(app).get(`${api}/designs/${made.id}`).set(auth(ownerToken));
      expect(get.status).toBe(404);
    });

    it("cannot delete someone else's design (404) and it survives", async () => {
      const made = (await saveDesign(ownerToken)).body.design;
      const del = await request(app).delete(`${api}/designs/${made.id}`).set(auth(otherToken));
      expect(del.status).toBe(404);
      const get = await request(app).get(`${api}/designs/${made.id}`).set(auth(ownerToken));
      expect(get.status).toBe(200);
    });
  });

  describe('share', () => {
    it('creates a share link, and asking again returns the same one', async () => {
      const made = (await saveDesign(ownerToken)).body.design;
      const first = await request(app).post(`${api}/designs/${made.id}/share`).set(auth(ownerToken));
      expect(first.status).toBe(200);
      expect(first.body.shareToken).toHaveLength(22); // 16 random bytes, base64url
      expect(first.body.sharePath).toBe(`/shared/${first.body.shareToken}`);
      const second = await request(app).post(`${api}/designs/${made.id}/share`).set(auth(ownerToken));
      expect(second.body.shareToken).toBe(first.body.shareToken);
    });

    it("someone else cannot share my design", async () => {
      const made = (await saveDesign(ownerToken)).body.design;
      const res = await request(app).post(`${api}/designs/${made.id}/share`).set(auth(otherToken));
      expect(res.status).toBe(404);
    });

    it('the shared design is public and shows no owner information', async () => {
      const made = (await saveDesign(ownerToken, { name: 'Public one' })).body.design;
      const { body } = await request(app).post(`${api}/designs/${made.id}/share`).set(auth(ownerToken));
      const res = await request(app).get(`${api}/shared/${body.shareToken}`); // no login
      expect(res.status).toBe(200);
      expect(res.body.design.name).toBe('Public one');
      const text = JSON.stringify(res.body);
      expect(text).not.toMatch(/userId|passwordHash|@example\.com/);
    });

    it('an unknown token returns 404', async () => {
      const res = await request(app).get(`${api}/shared/does-not-exist`);
      expect(res.status).toBe(404);
    });

    it('deleting the design kills its share link', async () => {
      const made = (await saveDesign(ownerToken)).body.design;
      const { body } = await request(app).post(`${api}/designs/${made.id}/share`).set(auth(ownerToken));
      await request(app).delete(`${api}/designs/${made.id}`).set(auth(ownerToken));
      const res = await request(app).get(`${api}/shared/${body.shareToken}`);
      expect(res.status).toBe(404);
    });
  });
});
