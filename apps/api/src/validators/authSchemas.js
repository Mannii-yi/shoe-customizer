import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(254);

/** Fields not listed here (for example "role") are dropped by zod, so clients cannot set them. */
export const registerBody = z.object({
  name: z.string().trim().min(1).max(80),
  email,
  // 72 because bcrypt ignores everything after 72 bytes
  password: z.string().min(8).max(72),
});

export const loginBody = z.object({
  email,
  password: z.string().min(1).max(72),
});
