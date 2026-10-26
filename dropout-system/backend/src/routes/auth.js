import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError, asyncHandler } from '../utils.js';
import { validate } from '../middleware/validate.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();
const sign = (u) => jwt.sign({ id: u._id, role: u.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: z.enum(['admin', 'faculty']).default('faculty'),
});
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(req.body.password))) throw new ApiError(401, 'Invalid email or password');
  res.json({ token: sign(user), user: publicUser(user) });
}));

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

// Admin-only: create faculty/admin accounts. (First admin: `npm run create-admin`.)
router.post('/register', protect, restrictTo('admin'), validate(registerSchema), asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ user: publicUser(user) });
}));

router.get('/users', protect, asyncHandler(async (_req, res) => {
  const users = await User.find().select('name email role').sort('name');
  res.json({ users });
}));

export default router;
