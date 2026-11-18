import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { registerBody, loginBody } from '../validators/authSchemas.js';
import { registerUser, loginUser, getCurrentUser } from '../services/authService.js';

const router = Router();

router.post(
  '/register',
  validate({ body: registerBody }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await registerUser(req.body));
  }),
);

router.post(
  '/login',
  validate({ body: loginBody }),
  asyncHandler(async (req, res) => {
    res.json(await loginUser(req.body));
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: await getCurrentUser(req.auth.userId) });
  }),
);

export default router;
