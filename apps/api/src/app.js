import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
    }),
  );
  app.use(express.json({ limit: '300kb' }));

  app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
