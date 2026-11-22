import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  const r = await prisma.$queryRaw`SELECT 1 AS ok`;
  console.log('CONNECTED', r);
} catch (e) {
  console.log('FAILED:', e.code, '|', e.message.split('\n').filter(Boolean).slice(-3).join(' / '));
}
await prisma.$disconnect();
