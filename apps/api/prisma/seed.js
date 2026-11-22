import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const seedPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../contracts/catalog.seed.json',
);

async function seedCatalog() {
  const catalog = JSON.parse(await readFile(seedPath, 'utf8'));
  const { model } = catalog;

  await prisma.shoeModel.upsert({
    where: { id: model.id },
    update: {
      name: model.name,
      basePriceInr: model.basePriceInr,
      glbPath: model.glbPath,
      defaultConfiguration: model.defaultConfiguration,
    },
    create: {
      id: model.id,
      name: model.name,
      basePriceInr: model.basePriceInr,
      glbPath: model.glbPath,
      defaultConfiguration: model.defaultConfiguration,
    },
  });

  for (const part of catalog.parts) {
    const partRow = await prisma.part.upsert({
      where: { modelId_key: { modelId: model.id, key: part.key } },
      update: { label: part.label, meshName: part.meshName, sortOrder: part.sortOrder },
      create: {
        modelId: model.id,
        key: part.key,
        label: part.label,
        meshName: part.meshName,
        sortOrder: part.sortOrder,
      },
    });

    const options = [
      ...part.options.materials.map((m) => ({
        kind: 'MATERIAL', slug: m.id, label: m.label, value: null, priceDeltaInr: m.priceDeltaInr,
      })),
      ...part.options.colors.map((c) => ({
        kind: 'COLOR', slug: c.id, label: c.label, value: c.hex, priceDeltaInr: c.priceDeltaInr,
      })),
    ];

    for (const o of options) {
      await prisma.partOption.upsert({
        where: { partId_kind_slug: { partId: partRow.id, kind: o.kind, slug: o.slug } },
        update: { label: o.label, value: o.value, priceDeltaInr: o.priceDeltaInr },
        create: { partId: partRow.id, ...o },
      });
    }
  }

  // Rule ids from the seed file are used directly as the database id.
  for (const rule of catalog.rules) {
    await prisma.priceRule.upsert({
      where: { id: rule.id },
      update: { modelId: model.id, type: rule.type, label: rule.label, params: rule.params },
      create: { id: rule.id, modelId: model.id, type: rule.type, label: rule.label, params: rule.params },
    });
  }
}

async function seedAdmin() {
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !password) {
    console.log('Admin user: skipped (ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD not set)');
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: { name: 'Admin', email, passwordHash, role: 'ADMIN' },
  });
  console.log('Admin user: ensured');
}

async function waitForDatabase() {
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (err) {
      console.log(`Database not ready (attempt ${attempt}/6), retrying in 5s...`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  throw new Error('Could not reach the database after 6 attempts');
}

async function main() {
  await waitForDatabase();
  await seedCatalog();
  await seedAdmin();
  const models = await prisma.shoeModel.count();
  const parts = await prisma.part.count();
  const options = await prisma.partOption.count();
  const rules = await prisma.priceRule.count();
  console.log({ models, parts, options, rules });
}

main()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
