import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { z } from 'zod';

const router = Router();

const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '7d';

const getAccessSecret = () =>
  process.env.JWT_SECRET || 'access-secret-change-me';
const getRefreshSecret = () =>
  process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-change-me';

const generateTokens = (userId: unknown, email: string) => {
  const accessToken = jwt.sign({ userId, email, type: 'access' }, getAccessSecret(), {
    expiresIn: ACCESS_EXPIRES,
  });
  const refreshToken = jwt.sign({ userId, email, type: 'refresh' }, getRefreshSecret(), {
    expiresIn: REFRESH_EXPIRES,
  });
  return { accessToken, refreshToken };
};

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: validation.error.issues,
      });
    }

    const { email, password, name } = validation.data;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserModel({
      email,
      password: hashedPassword,
      name,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { email: user.email, name: user.name },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: (error as Error).message,
    });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: validation.error.issues,
      });
    }

    const { email, password } = validation.data;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.email);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: { id: user._id, email: user.email, name: user.name },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: (error as Error).message,
    });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const validation = refreshSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    const { refreshToken } = validation.data;

    let decoded: { userId: string; email: string; type: string };
    try {
      decoded = jwt.verify(refreshToken, getRefreshSecret()) as typeof decoded;
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type',
      });
    }

    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    const tokens = generateTokens(user._id, user.email);

    res.json({
      success: true,
      message: 'Token refreshed',
      data: tokens,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: (error as Error).message,
    });
  }
});

export default router;
