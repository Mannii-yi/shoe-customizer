import { createApp } from './app.js';
import { env, assertAuthConfig } from './config/env.js';
import { warmCatalogCache } from './services/catalogService.js';

assertAuthConfig(); // stop at startup, with a clear message, if JWT_SECRET is missing

const app = createApp();

app.listen(env.port, () => {
  console.log(`API listening on port ${env.port} (${env.nodeEnv})`);
  warmCatalogCache(); // not awaited: the server is already accepting requests
});
