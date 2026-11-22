import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { createRateLimiters } from './middleware/rateLimit.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

/**
 * Creates the Express app.
 * @param {{rateLimits?: {auth?: number, general?: number}}} [options]
 * @returns {import('express').Express}
 */
export function createApp({ rateLimits } = {}) {
  const app = express();

  // Behind Render's proxy, trust one hop so rate limits see the real client IP.
  if (env.nodeEnv === 'production') app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // No origin = curl, Postman, server-to-server: allow.
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        return callback(null, false); // blocked by the browser, not a crash
      },
    }),
  );
  app.use(express.json({ limit: '300kb' }));

  const { authLimiter, generalLimiter } = createRateLimiters(rateLimits);
  app.use('/api/v1', generalLimiter);
  app.use('/api/v1/auth', authLimiter);

  app.use('/api/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
