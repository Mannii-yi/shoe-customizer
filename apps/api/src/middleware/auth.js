import { forbidden, unauthorized } from '../utils/errors.js';
import { verifyToken } from '../services/authService.js';

/**
 * Requires "Authorization: Bearer <jwt>". Sets req.auth = { userId, role }.
 * The role comes from the token, so a role change takes effect when the token is renewed.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (!token || scheme.toLowerCase() !== 'bearer') {
    return next(unauthorized('Missing bearer token'));
  }
  try {
    req.auth = verifyToken(token);
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Use after requireAuth. Lets only the given role through.
 * @param {'ADMIN'|'USER'} role
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.auth) return next(unauthorized());
    if (req.auth.role !== role) return next(forbidden());
    return next();
  };
}
