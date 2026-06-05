import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { verifyToken } from '../middleware/verifyToken.js';
import {
  sanitizeString,
  isValidEmail,
  isValidPassword,
  isValidGrade,
  isValidName,
} from '../utils/authValidation.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const JWT_EXPIRES = '7d';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET chưa được cấu hình');
  }
  return secret;
}

function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES }
  );
}

function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

function clearAuthCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
}

router.post('/auth/register', async (req, res) => {
  try {
    const name = sanitizeString(req.body?.name, 100);
    const email = sanitizeString(req.body?.email, 254).toLowerCase();
    const password = req.body?.password;
    const grade = req.body?.grade != null ? Number(req.body.grade) : null;

    if (!isValidName(name)) {
      return res.status(400).json({ error: 'Tên phải có ít nhất 2 ký tự' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email không hợp lệ' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 8 ký tự' });
    }
    if (grade != null && !isValidGrade(grade)) {
      return res.status(400).json({ error: 'Lớp phải từ 6 đến 12' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email đã được đăng ký' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: 'student',
      grade: grade ?? null,
    });

    const token = signToken(user);
    setAuthCookie(res, token);

    res.status(201).json({ user: user.toPublicJSON() });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ error: 'Không thể đăng ký tài khoản' });
  }
});

router.post('/auth/login', loginLimiter, async (req, res) => {
  try {
    const email = sanitizeString(req.body?.email, 254).toLowerCase();
    const password = req.body?.password;

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email không hợp lệ' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Vui lòng nhập mật khẩu' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Không thể đăng nhập' });
  }
});

router.get(
  '/auth/google',
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(503).json({ error: 'Google OAuth chưa được cấu hình' });
    }
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?error=google_failed`,
  }),
  (req, res) => {
    try {
      const token = signToken(req.user);
      setAuthCookie(res, token);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/?auth=success`);
    } catch (err) {
      console.error('[auth/google/callback]', err);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth?error=google_failed`);
    }
  }
);

router.post('/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/auth/me', verifyToken, (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
});

export default router;
