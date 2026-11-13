import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

/**
 * Creates the Express app.
 * @returns {import('express').Express}
 */
export function createApp() {
  const app = express();

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

  app.use('/api/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
