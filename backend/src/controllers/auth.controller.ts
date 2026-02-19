import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../middleware/error.middleware.js";
import { createAccessToken, createRefreshToken, hashToken, verifyRefreshToken } from "../services/token.service.js";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().trim().email(),
  password: z.string().min(6).max(128)
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(128)
});

const refreshBodySchema = z.object({
  refreshToken: z.string().optional()
});

const refreshTokenCookieName = "refreshToken";

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: false,
  path: "/auth",
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
};

const storeRefreshToken = async (userId: string, refreshToken: string): Promise<void> => {
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
    }
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("Email already in use", 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash }
  });

  const accessToken = createAccessToken({ sub: user.id, email: user.email });
  const refreshToken = createRefreshToken(user.id);
  await storeRefreshToken(user.id, refreshToken);

  res.cookie(refreshTokenCookieName, refreshToken, refreshCookieOptions);
  res.status(201).json({
    accessToken,
    user: { id: user.id, name: user.name, email: user.email }
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const accessToken = createAccessToken({ sub: user.id, email: user.email });
  const refreshToken = createRefreshToken(user.id);
  await storeRefreshToken(user.id, refreshToken);

  res.cookie(refreshTokenCookieName, refreshToken, refreshCookieOptions);
  res.json({
    accessToken,
    user: { id: user.id, name: user.name, email: user.email }
  });
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const parsed = refreshBodySchema.parse(req.body ?? {});
  const token = req.cookies?.[refreshTokenCookieName] ?? parsed.refreshToken;
  if (!token) {
    throw new AppError("Refresh token missing", 401);
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  const tokenHash = hashToken(token);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError("Invalid refresh token", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AppError("Invalid refresh token", 401);
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

  const newRefreshToken = createRefreshToken(user.id);
  await storeRefreshToken(user.id, newRefreshToken);

  const accessToken = createAccessToken({ sub: user.id, email: user.email });
  res.cookie(refreshTokenCookieName, newRefreshToken, refreshCookieOptions);
  res.json({ accessToken });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const parsed = refreshBodySchema.parse(req.body ?? {});
  const token = req.cookies?.[refreshTokenCookieName] ?? parsed.refreshToken;

  if (token) {
    const tokenHash = hashToken(token);
    await prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null
      },
      data: { revokedAt: new Date() }
    });
  }

  res.clearCookie(refreshTokenCookieName, { ...refreshCookieOptions, maxAge: undefined });
  res.status(204).send();
};
