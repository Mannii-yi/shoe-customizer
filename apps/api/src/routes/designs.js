import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { createDesignBody, updateDesignBody, idParams } from '../validators/designSchemas.js';
import * as designs from '../services/designService.js';

const router = Router();
router.use(requireAuth); // every design route needs a logged-in user

router.post(
  '/',
  validate({ body: createDesignBody }),
  asyncHandler(async (req, res) => {
    res.status(201).json({ design: await designs.createDesign(req.auth.userId, req.body) });
  }),
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ designs: await designs.listDesigns(req.auth.userId) });
  }),
);

router.get(
  '/:id',
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    res.json({ design: await designs.getDesign(req.auth.userId, req.params.id) });
  }),
);

router.patch(
  '/:id',
  validate({ params: idParams, body: updateDesignBody }),
  asyncHandler(async (req, res) => {
    res.json({ design: await designs.updateDesign(req.auth.userId, req.params.id, req.body) });
  }),
);

router.delete(
  '/:id',
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    await designs.deleteDesign(req.auth.userId, req.params.id);
    res.status(204).end();
  }),
);

router.post(
  '/:id/share',
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    res.json(await designs.shareDesign(req.auth.userId, req.params.id));
  }),
);

export default router;
