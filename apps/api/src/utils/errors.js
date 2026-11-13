/**
 * An error that is safe to show to the client.
 * Becomes { error: { code, message, details? } } in the error handler.
 */
export class AppError extends Error {
  /**
   * @param {number} status HTTP status
   * @param {string} code one of the contract error codes
   * @param {string} message human-readable text
   * @param {object[]} [details]
   */
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const notFound = (message = 'Not found') => new AppError(404, 'NOT_FOUND', message);
