import 'dotenv/config';

/**
 * Central place for environment settings.
 * Other files import from here instead of reading process.env directly.
 * Secrets are read lazily (getters), so a missing secret only fails where it is needed.
 */
export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  /** @returns {string} the JWT signing secret (32+ characters) */
  get jwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET must be set and at least 32 characters long');
    }
    return secret;
  },
  get jwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || '7d';
  },
};

/** Called once at server start so a missing secret fails immediately, not on the first login. */
export function assertAuthConfig() {
  void env.jwtSecret;
}
