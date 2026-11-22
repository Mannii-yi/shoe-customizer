import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { env } from '../config/env.js';
import { conflict, unauthorized } from '../utils/errors.js';

const BCRYPT_COST = 10;

/** @typedef {{id:string,name:string,email:string,role:'USER'|'ADMIN'}} PublicUser */

/**
 * Only these fields ever leave the server. The password hash is never included.
 * @returns {PublicUser}
 */
export function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/** Signs a 7-day (configurable) HS256 token with payload { sub, role }. */
export function signToken(user) {
  return jwt.sign({ role: user.role }, env.jwtSecret, {
    algorithm: 'HS256',
    subject: user.id,
    expiresIn: env.jwtExpiresIn,
  });
}

/**
 * Verifies a token. Only HS256 is accepted, so "alg: none" tokens are rejected.
 * @returns {{userId:string, role:string}}
 * @throws {AppError} 401 when the token is missing, invalid or expired
 */
export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    if (typeof payload.sub !== 'string') throw new Error('no subject');
    return { userId: payload.sub, role: payload.role };
  } catch {
    throw unauthorized('Invalid or expired token');
  }
}

/**
 * @param {{name:string,email:string,password:string}} input already validated and lowercased
 * @throws {AppError} 409 when the email is already registered
 */
export async function registerUser({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  try {
    // role is never taken from the request: new accounts are always USER
    const user = await prisma.user.create({ data: { name, email, passwordHash, role: 'USER' } });
    return { token: signToken(user), user: toPublicUser(user) };
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict('An account with this email already exists');
    throw err;
  }
}

let dummyHash;

/**
 * Same generic error for "no such email" and "wrong password", and the same work is done
 * in both cases, so neither the message nor the response time reveals which emails exist.
 * @throws {AppError} 401
 */
export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  dummyHash ??= await bcrypt.hash('not-a-real-password', BCRYPT_COST);
  const ok = await bcrypt.compare(password, user ? user.passwordHash : dummyHash);
  if (!user || !ok) throw unauthorized('Invalid email or password');
  return { token: signToken(user), user: toPublicUser(user) };
}

/**
 * @param {string} id
 * @throws {AppError} 401 when the account no longer exists
 */
export async function getCurrentUser(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw unauthorized('Invalid or expired token');
  return toPublicUser(user);
}

function isUniqueViolation(err) {
  return err?.code === 'P2002' || err?.cause?.originalCode === '23505' || err?.meta?.driverAdapterError?.cause?.originalCode === '23505';
}
