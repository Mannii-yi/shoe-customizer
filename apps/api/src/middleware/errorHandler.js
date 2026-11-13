import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { InvalidConfigurationError } from '../services/pricing.js';

/** 404 for any route that does not exist. */
export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}

const send = (res, status, code, message, details) =>
  res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });

/**
 * Central error handler: every error leaves the API in the contract format.
 * Never sends stack traces; unexpected errors are logged on the server only.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return send(res, err.status, err.code, err.message, err.details);
  }
  if (err instanceof InvalidConfigurationError) {
    return send(res, 422, 'INVALID_CONFIGURATION', 'The configuration is not valid', err.details);
  }
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), reason: i.message }));
    return send(res, 400, 'VALIDATION_ERROR', 'Request validation failed', details);
  }
  // body-parser problems: broken JSON or a body over the size limit
  if (err.type === 'entity.parse.failed') {
    return send(res, 400, 'VALIDATION_ERROR', 'Request body is not valid JSON');
  }
  if (err.type === 'entity.too.large') {
    return send(res, 400, 'VALIDATION_ERROR', 'Request body is too large');
  }

  console.error('Unexpected error:', err.message);
  return send(res, 500, 'INTERNAL', 'Something went wrong');
}
