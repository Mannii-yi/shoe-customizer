/**
 * Wraps an async route handler so thrown errors reach the error handler.
 * (Express 4 does not do this on its own.)
 * @param {(req, res, next) => Promise<void>} fn
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
