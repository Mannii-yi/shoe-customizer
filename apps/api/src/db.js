import { PrismaClient } from '@prisma/client';

/**
 * The one shared Prisma client. Import it from here; never create another.
 * It connects on the first query, not at import time.
 */
export const prisma = new PrismaClient();
