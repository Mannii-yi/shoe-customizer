import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { getPublicCatalog, getInternalCatalog, listModels } from '../services/catalogService.js';
import { calculateQuote } from '../services/pricing.js';

const router = Router();

const modelParams = z.object({ modelId: z.string().min(1).max(60) });

// Shape problems are 400. Wrong material/color ids are 422, decided by the pricing engine.
const quoteBody = z.object({
  modelId: z.string().min(1).max(60),
  configuration: z.object({ parts: z.record(z.string(), z.unknown()) }),
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.get(
  '/models',
  asyncHandler(async (req, res) => {
    res.json({ models: await listModels() });
  }),
);

router.get(
  '/models/:modelId/catalog',
  validate({ params: modelParams }),
  asyncHandler(async (req, res) => {
    res.json(await getPublicCatalog(req.params.modelId));
  }),
);

router.post(
  '/price/quote',
  validate({ body: quoteBody }),
  asyncHandler(async (req, res) => {
    const catalog = await getInternalCatalog(req.body.modelId);
    res.json(calculateQuote(catalog, req.body.configuration));
  }),
);

export default router;
