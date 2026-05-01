import { Router, Response, Request, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { prisma } from '../db';
import { registerSchema, loginSchema } from '../validators';
import { authRateLimit } from '../middleware/rate-limit';

const router = Router();

router.use(authRateLimit);

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const REFRESH_COOKIE_OPTIONS: Partial<Response['cookie']> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN } as jwt.SignOptions);
  const refreshToken = randomBytes(48).toString('hex');
  const refreshJwt = jwt.sign({ userId, token: refreshToken }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN } as jwt.SignOptions);
  return { accessToken, refreshToken, refreshJwt };
}

async function storeRefreshToken(userId: string, refreshToken: string, expiresIn: string) {
  const expiresMs = parseInt(expiresIn) * (expiresIn.includes('d') ? 86400000 : expiresIn.includes('h') ? 3600000 : 60000);
  return prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + expiresMs),
    },
  });
}

router.post('/register', async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.errors });
  }

  const { email, password } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword },
  });

  const { accessToken, refreshToken, refreshJwt } = generateTokens(user.id);
  await storeRefreshToken(user.id, refreshToken, REFRESH_EXPIRES_IN);

  res.cookie('refreshToken', refreshJwt, REFRESH_COOKIE_OPTIONS as any);
  res.status(201).json({ id: user.id, email: user.email });
});

router.post('/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.errors });
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { accessToken, refreshToken, refreshJwt } = generateTokens(user.id);
  await storeRefreshToken(user.id, refreshToken, REFRESH_EXPIRES_IN);

  res.cookie('refreshToken', refreshJwt, REFRESH_COOKIE_OPTIONS as any);
  res.json({ id: user.id, email: user.email });
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  try {
    const payload = jwt.verify(token, REFRESH_SECRET) as { userId: string; token: string };

    const stored = await prisma.refreshToken.findUnique({ where: { token: payload.token } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      // Replay attack detection: if token exists but is revoked, revoke entire session
      if (stored?.revoked) {
        await prisma.refreshToken.updateMany({
          where: { userId: payload.userId, revoked: false },
          data: { revoked: true },
        });
      }
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Rotate: revoke old token, issue new one
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

    const { accessToken, refreshToken, refreshJwt } = generateTokens(payload.userId);
    await storeRefreshToken(payload.userId, refreshToken, REFRESH_EXPIRES_IN);

    res.cookie('refreshToken', refreshJwt, REFRESH_COOKIE_OPTIONS as any);
    res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    try {
      const payload = jwt.verify(token, REFRESH_SECRET) as { token: string };
      await prisma.refreshToken.updateMany({ where: { token: payload.token }, data: { revoked: true } });
    } catch {
      // Token invalid, just clear cookie
    }
  }

  res.clearCookie('refreshToken', { path: '/' });
  res.json({ message: 'Logged out' });
});

export default router;
