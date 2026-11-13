import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();
const api = '/api/v1';

async function defaultConfig() {
  const res = await request(app).get(`${api}/models/runner-01/catalog`);
  return structuredClone(res.body.model.defaultConfiguration);
}

describe('GET /models', () => {
  it('lists the model', async () => {
    const res = await request(app).get(`${api}/models`);
    expect(res.status).toBe(200);
    expect(res.body.models[0]).toEqual({
      id: 'runner-01',
      name: 'Runner 01',
      basePriceInr: 5999,
      glbPath: '/models/runner.glb',
    });
  });
});

describe('GET /models/:modelId/catalog', () => {
  it('returns the contract shape with 10 parts', async () => {
    const res = await request(app).get(`${api}/models/runner-01/catalog`);
    expect(res.status).toBe(200);
    expect(res.body.model.id).toBe('runner-01');
    expect(res.body.parts).toHaveLength(10);
    const upper = res.body.parts.find((p) => p.key === 'upper');
    expect(upper.meshName).toBe('part_upper');
    expect(upper.options.colors[0]).toHaveProperty('hex');
  });

  it('does not leak rule params', async () => {
    const res = await request(app).get(`${api}/models/runner-01/catalog`);
    expect(res.body.rules.length).toBeGreaterThanOrEqual(3);
    for (const rule of res.body.rules) {
      expect(Object.keys(rule).sort()).toEqual(['id', 'label', 'type']);
    }
  });

  it('returns 404 in the error format for an unknown model', async () => {
    const res = await request(app).get(`${api}/models/nope/catalog`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('POST /price/quote', () => {
  it('prices the default shoe at the base price', async () => {
    const res = await request(app)
      .post(`${api}/price/quote`)
      .send({ modelId: 'runner-01', configuration: await defaultConfig() });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      modelId: 'runner-01',
      currency: 'INR',
      basePriceInr: 5999,
      lines: [],
      totalInr: 5999,
    });
  });

  it('prices the blueprint worked example at 8041', async () => {
    const cfg = await defaultConfig();
    cfg.parts.upper.materialId = 'leather';
    cfg.parts.toe_cap.materialId = 'suede';
    cfg.parts.laces.colorId = 'neon-lime';
    cfg.parts.logo.colorId = 'gold';
    cfg.parts.midsole.materialId = 'rubber';
    const res = await request(app)
      .post(`${api}/price/quote`)
      .send({ modelId: 'runner-01', configuration: cfg });
    expect(res.status).toBe(200);
    expect(res.body.totalInr).toBe(8041);
    expect(res.body.lines.map((l) => l.type)).toEqual([
      'OPTION', 'OPTION', 'OPTION', 'OPTION', 'OPTION', 'RULE', 'DISCOUNT',
    ]);
  });

  it('ignores a total sent by the client', async () => {
    const res = await request(app)
      .post(`${api}/price/quote`)
      .send({ modelId: 'runner-01', configuration: await defaultConfig(), totalInr: 1 });
    expect(res.body.totalInr).toBe(5999);
  });

  it('returns 422 INVALID_CONFIGURATION with details for a bad color', async () => {
    const cfg = await defaultConfig();
    cfg.parts.upper.colorId = 'pink';
    const res = await request(app)
      .post(`${api}/price/quote`)
      .send({ modelId: 'runner-01', configuration: cfg });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_CONFIGURATION');
    expect(res.body.error.details).toEqual([
      { partKey: 'upper', field: 'colorId', reason: 'color not available for this part' },
    ]);
  });

  it('returns 422 for a missing part', async () => {
    const cfg = await defaultConfig();
    delete cfg.parts.laces;
    const res = await request(app)
      .post(`${api}/price/quote`)
      .send({ modelId: 'runner-01', configuration: cfg });
    expect(res.status).toBe(422);
  });

  it('returns 404 for an unknown model', async () => {
    const res = await request(app)
      .post(`${api}/price/quote`)
      .send({ modelId: 'nope', configuration: await defaultConfig() });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 VALIDATION_ERROR when the body is the wrong shape', async () => {
    const res = await request(app).post(`${api}/price/quote`).send({ modelId: 'runner-01' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe('configuration');
  });

  it('returns 400 for broken JSON, without a stack trace', async () => {
    const res = await request(app)
      .post(`${api}/price/quote`)
      .set('Content-Type', 'application/json')
      .send('{"modelId": ');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.js/);
  });
});

describe('unknown routes', () => {
  it('return 404 in the error format', async () => {
    const res = await request(app).get(`${api}/nothing-here`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });
});
