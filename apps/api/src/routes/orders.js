import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { checkoutBody } from '../validators/shopSchemas.js';
import { idParams } from '../validators/designSchemas.js';
import * as orders from '../services/orderService.js';

const router = Router();
router.use(requireAuth);

router.post(
  '/checkout',
  validate({ body: checkoutBody }),
  asyncHandler(async (req, res) => {
    res.status(201).json({ order: await orders.checkout(req.auth.userId, req.body) });
  }),
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ orders: await orders.listOrders(req.auth.userId) });
  }),
);

router.get(
  '/:id',
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    res.json({ order: await orders.getOrder(req.auth.userId, req.params.id) });
  }),
);

export default router;
