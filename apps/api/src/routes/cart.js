import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { addCartItemBody, updateCartItemBody } from '../validators/shopSchemas.js';
import { idParams } from '../validators/designSchemas.js';
import * as cart from '../services/cartService.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await cart.getCart(req.auth.userId));
  }),
);

router.post(
  '/items',
  validate({ body: addCartItemBody }),
  asyncHandler(async (req, res) => {
    res.status(201).json({ cart: await cart.addItem(req.auth.userId, req.body) });
  }),
);

router.patch(
  '/items/:id',
  validate({ params: idParams, body: updateCartItemBody }),
  asyncHandler(async (req, res) => {
    res.json({ cart: await cart.updateItem(req.auth.userId, req.params.id, req.body) });
  }),
);

router.delete(
  '/items/:id',
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    res.json({ cart: await cart.removeItem(req.auth.userId, req.params.id) });
  }),
);

export default router;
