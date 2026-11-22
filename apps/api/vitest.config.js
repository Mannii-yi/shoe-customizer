import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The database tests make many calls each. Over a remote database (Neon, Supabase)
    // that can pass vitest's default 5 seconds even though nothing is wrong.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
