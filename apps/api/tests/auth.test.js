import 'dotenv/config';
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';
import { requireRole } from '../src/middleware/auth.js';

// Auth needs a signing secret. Tests use their own, so no real secret is involved.
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';

const api = '/api/v1';
const app = createApp({ rateLimits: { auth: 1000, general: 1000 } });
const hasDb = Boolean(process.env.DATABASE_URL);

// Test accounts use unique "test+<uuid>" emails and are deleted afterwards,
// so these tests never touch real data and can run against a dev database.
const newEmail = () => `test+auth-${randomUUID()}@example.com`;
const password = 'correct-horse-9';

afterAll(async () => {
  if (hasDb) await prisma.user.deleteMany({ where: { email: { startsWith: 'test+auth-' } } });
  await prisma.$disconnect();
});

describe('auth without a database', () => {
  it('GET /auth/me without a token returns 401', async () => {
    const res = await request(app).get(`${api}/auth/me`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a garbage token', async () => {
    const res = await request(app).get(`${api}/auth/me`).set('Authorization', 'Bearer not-a-token');
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with another secret', async () => {
    const forged = jwt.sign({ role: 'ADMIN' }, 'x'.repeat(40), { subject: 'abc', algorithm: 'HS256' });
    const res = await request(app).get(`${api}/auth/me`).set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const old = jwt.sign({ role: 'USER' }, process.env.JWT_SECRET, { subject: 'abc', expiresIn: -10 });
    const res = await request(app).get(`${api}/auth/me`).set('Authorization', `Bearer ${old}`);
    expect(res.status).toBe(401);
  });

  it('rejects an unsigned (alg: none) token', async () => {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const none = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: 'abc', role: 'ADMIN' })}.`;
    const res = await request(app).get(`${api}/auth/me`).set('Authorization', `Bearer ${none}`);
    expect(res.status).toBe(401);
  });

  it('register validates the body (400, nothing saved)', async () => {
    const bad = [
      { name: 'A', email: 'not-an-email', password },
      { name: 'A', email: newEmail(), password: 'short' },
      { name: '', email: newEmail(), password },
      { name: 'A', email: newEmail(), password: 'x'.repeat(73) },
      {},
    ];
    for (const body of bad) {
      const res = await request(app).post(`${api}/auth/register`).send(body);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rate limits auth routes with the contract error format', async () => {
    const limited = createApp({ rateLimits: { auth: 2, general: 1000 } });
    const hit = () => request(limited).post(`${api}/auth/login`).send({});
    expect((await hit()).status).toBe(400);
    expect((await hit()).status).toBe(400);
    const res = await hit();
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });

  it('requireRole lets only the right role through', () => {
    const run = (auth) => {
      let result;
      requireRole('ADMIN')({ auth }, {}, (err) => (result = err));
      return result;
    };
    expect(run({ role: 'ADMIN' })).toBeUndefined();
    expect(run({ role: 'USER' }).status).toBe(403);
    expect(run(undefined).status).toBe(401);
  });
});

describe.skipIf(!hasDb)('auth with the database', () => {
  it('registers: 201, token, public user, lowercase email, no password hash', async () => {
    const email = newEmail().toUpperCase().replace('TEST+', 'test+');
    const res = await request(app).post(`${api}/auth/register`).send({ name: ' Asha ', email, password });
    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toEqual({
      id: expect.any(String),
      name: 'Asha',
      email: email.toLowerCase(),
      role: 'USER',
    });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
  });

  it('stores only a bcrypt hash, never the password', async () => {
    const email = newEmail();
    await request(app).post(`${api}/auth/register`).send({ name: 'B', email, password });
    const row = await prisma.user.findUnique({ where: { email } });
    expect(row.passwordHash).not.toBe(password);
    expect(row.passwordHash).toMatch(/^\$2[aby]\$10\$/);
  });

  it('ignores a role sent by the client', async () => {
    const res = await request(app)
      .post(`${api}/auth/register`)
      .send({ name: 'C', email: newEmail(), password, role: 'ADMIN' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('USER');
  });

  it('returns 409 for a duplicate email, even in different case', async () => {
    const email = newEmail();
    await request(app).post(`${api}/auth/register`).send({ name: 'D', email, password });
    const res = await request(app)
      .post(`${api}/auth/register`)
      .send({ name: 'D2', email: email.toUpperCase().replace('TEST+', 'test+'), password });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('logs in and the token works on /auth/me', async () => {
    const email = newEmail();
    await request(app).post(`${api}/auth/register`).send({ name: 'E', email, password });
    const login = await request(app).post(`${api}/auth/login`).send({ email, password });
    expect(login.status).toBe(200);
    const me = await request(app).get(`${api}/auth/me`).set('Authorization', `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);
  });

  it('token is HS256, carries sub and role, and expires in about 7 days', async () => {
    const email = newEmail();
    const reg = await request(app).post(`${api}/auth/register`).send({ name: 'F', email, password });
    const { header, payload } = jwt.decode(reg.body.token, { complete: true });
    expect(header.alg).toBe('HS256');
    expect(payload.sub).toBe(reg.body.user.id);
    expect(payload.role).toBe('USER');
    const days = (payload.exp - payload.iat) / 86400;
    expect(days).toBe(7);
  });

  it('gives the same generic 401 for a wrong password and an unknown email', async () => {
    const email = newEmail();
    await request(app).post(`${api}/auth/register`).send({ name: 'G', email, password });
    const wrongPw = await request(app).post(`${api}/auth/login`).send({ email, password: 'wrong-password' });
    const noUser = await request(app).post(`${api}/auth/login`).send({ email: newEmail(), password });
    expect(wrongPw.status).toBe(401);
    expect(noUser.status).toBe(401);
    expect(wrongPw.body).toEqual(noUser.body);
    expect(wrongPw.body.error.message).toBe('Invalid email or password');
  });

  it('rejects a valid token whose user no longer exists', async () => {
    const email = newEmail();
    const reg = await request(app).post(`${api}/auth/register`).send({ name: 'H', email, password });
    await prisma.user.delete({ where: { email } });
    const me = await request(app).get(`${api}/auth/me`).set('Authorization', `Bearer ${reg.body.token}`);
    expect(me.status).toBe(401);
  });
});
