import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';
import { getInternalCatalog, clearCatalogCache } from '../src/services/catalogService.js';

const api = '/api/v1';
const app = createApp({ rateLimits: { auth: 1000, general: 1000 } });
const hasDb = Boolean(process.env.DATABASE_URL);

const seed = JSON.parse(
  readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../contracts/catalog.seed.json'),
    'utf8',
  ),
);
const byId = (a, b) => a.id.localeCompare(b.id);

afterAll(async () => {
  await prisma.$disconnect();
});

describe.skipIf(!hasDb)('catalog from the database', () => {
  // These tests only READ the real catalog, and run before the ones that add temporary rows.
  describe('matches contracts/catalog.seed.json (run "npm run db:seed" if this fails)', () => {
    it('model', async () => {
      const { body } = await request(app).get(`${api}/models/runner-01/catalog`);
      expect(body.model).toEqual(seed.model);
    });

    it('parts, in the same order, with the same options and prices', async () => {
      const { body } = await request(app).get(`${api}/models/runner-01/catalog`);
      expect(body.parts.map((p) => p.key)).toEqual(seed.parts.map((p) => p.key));
      for (const want of seed.parts) {
        const got = body.parts.find((p) => p.key === want.key);
        expect(got.label).toBe(want.label);
        expect(got.meshName).toBe(want.meshName);
        expect(got.sortOrder).toBe(want.sortOrder);
        expect([...got.options.materials].sort(byId)).toEqual([...want.options.materials].sort(byId));
        expect([...got.options.colors].sort(byId)).toEqual([...want.options.colors].sort(byId));
      }
    });

    it('price rules, including their parameters', async () => {
      const catalog = await getInternalCatalog('runner-01');
      const sortById = (rules) => [...rules].sort(byId);
      expect(sortById(catalog.rules)).toEqual(
        sortById(seed.rules.map(({ id, label, type, params }) => ({ id, label, type, params }))),
      );
    });

    it('the public catalog still hides rule parameters', async () => {
      const { body } = await request(app).get(`${api}/models/runner-01/catalog`);
      for (const rule of body.rules) expect(Object.keys(rule).sort()).toEqual(['id', 'label', 'type']);
    });
  });

  describe('inactive and changed rows (temporary test rows, removed afterwards)', () => {
    const cleanup = async () => {
      await prisma.partOption.deleteMany({ where: { slug: { startsWith: 'zz-test-' } } });
      await prisma.priceRule.deleteMany({ where: { id: { startsWith: 'zz-test-' } } });
      await prisma.shoeModel.deleteMany({ where: { id: { startsWith: 'zz-test-' } } });
      clearCatalogCache();
    };

    const defaultConfig = async () =>
      structuredClone((await request(app).get(`${api}/models/runner-01/catalog`)).body.model.defaultConfiguration);
    const quote = async (configuration) =>
      request(app).post(`${api}/price/quote`).send({ modelId: 'runner-01', configuration });

    beforeAll(async () => {
      await cleanup(); // remove anything left over from an interrupted earlier run
      const upper = await prisma.part.findFirst({ where: { modelId: 'runner-01', key: 'upper' } });
      await prisma.partOption.createMany({
        data: [
          { partId: upper.id, kind: 'MATERIAL', slug: 'zz-test-active', label: 'ZZ Active', priceDeltaInr: 77, isActive: true },
          { partId: upper.id, kind: 'MATERIAL', slug: 'zz-test-inactive', label: 'ZZ Inactive', priceDeltaInr: 55, isActive: false },
        ],
      });
      // If this inactive rule were applied, the default shoe (mesh upper) would cost 500 extra.
      await prisma.priceRule.create({
        data: {
          id: 'zz-test-rule-inactive',
          modelId: 'runner-01',
          type: 'COMBO_SURCHARGE',
          label: 'ZZ inactive rule',
          params: { when: [{ partKey: 'upper', kind: 'MATERIAL', slug: 'mesh' }], amountInr: 500 },
          isActive: false,
        },
      });
      await prisma.shoeModel.create({
        data: {
          id: 'zz-test-inactive-model',
          name: 'ZZ',
          basePriceInr: 1,
          glbPath: '/x.glb',
          defaultConfiguration: {},
          isActive: false,
        },
      });
      clearCatalogCache();
    });

    afterAll(cleanup);

    it('an active option shows up in the catalog and is priced from the database', async () => {
      const { body } = await request(app).get(`${api}/models/runner-01/catalog`);
      const upper = body.parts.find((p) => p.key === 'upper');
      expect(upper.options.materials).toContainEqual({ id: 'zz-test-active', label: 'ZZ Active', priceDeltaInr: 77 });
      const cfg = await defaultConfig();
      cfg.parts.upper.materialId = 'zz-test-active';
      const res = await quote(cfg);
      expect(res.status).toBe(200);
      expect(res.body.totalInr).toBe(5999 + 77);
    });

    it('an inactive option is hidden and rejected with 422', async () => {
      const { body } = await request(app).get(`${api}/models/runner-01/catalog`);
      const upper = body.parts.find((p) => p.key === 'upper');
      expect(upper.options.materials.map((m) => m.id)).not.toContain('zz-test-inactive');
      const cfg = await defaultConfig();
      cfg.parts.upper.materialId = 'zz-test-inactive';
      const res = await quote(cfg);
      expect(res.status).toBe(422);
      expect(res.body.error.details[0]).toMatchObject({ partKey: 'upper', field: 'materialId' });
    });

    it('an inactive rule is hidden and never applied', async () => {
      const { body } = await request(app).get(`${api}/models/runner-01/catalog`);
      expect(body.rules.map((r) => r.id)).not.toContain('zz-test-rule-inactive');
      expect((await quote(await defaultConfig())).body.totalInr).toBe(5999);
    });

    it('an inactive model is not listed and returns 404 everywhere', async () => {
      const models = await request(app).get(`${api}/models`);
      expect(models.body.models.map((m) => m.id)).not.toContain('zz-test-inactive-model');
      expect((await request(app).get(`${api}/models/zz-test-inactive-model/catalog`)).status).toBe(404);
      const res = await request(app)
        .post(`${api}/price/quote`)
        .send({ modelId: 'zz-test-inactive-model', configuration: await defaultConfig() });
      expect(res.status).toBe(404);
    });

    it('a price change in the database takes effect once the cache is cleared', async () => {
      const upper = await prisma.part.findFirst({ where: { modelId: 'runner-01', key: 'upper' } });
      await prisma.partOption.update({
        where: { partId_kind_slug: { partId: upper.id, kind: 'MATERIAL', slug: 'zz-test-active' } },
        data: { priceDeltaInr: 120 },
      });
      const cfg = await defaultConfig();
      cfg.parts.upper.materialId = 'zz-test-active';
      expect((await quote(cfg)).body.totalInr).toBe(5999 + 77); // still cached
      clearCatalogCache();
      expect((await quote(cfg)).body.totalInr).toBe(5999 + 120); // fresh from the database
    });
  });
});
