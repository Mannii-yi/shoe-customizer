import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { tokenParams } from '../validators/designSchemas.js';
import { getSharedDesign } from '../services/designService.js';

const router = Router();

// Public: no login needed, no owner information in the response.
router.get(
  '/:token',
  validate({ params: tokenParams }),
  asyncHandler(async (req, res) => {
    res.json({ design: await getSharedDesign(req.params.token) });
  }),
);

export default router;
