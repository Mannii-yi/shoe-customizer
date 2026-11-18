import { createApp } from './app.js';
import { env, assertAuthConfig } from './config/env.js';

assertAuthConfig(); // stop at startup, with a clear message, if JWT_SECRET is missing

const app = createApp();

app.listen(env.port, () => {
  console.log(`API listening on port ${env.port} (${env.nodeEnv})`);
});
