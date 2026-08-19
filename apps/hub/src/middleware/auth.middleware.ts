import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { Member } from '../types';

// Extend Express Request interface to include authenticated member
declare global {
  namespace Express {
    interface Request {
      member?: Member;
      rawApiKey?: string;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'] || req.headers['x-api-key'];

  let apiKey: string | undefined;

  if (typeof authHeader === 'string') {
    if (authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7).trim();
    } else {
      apiKey = authHeader.trim();
    }
  }

  if (!apiKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing API key. Please provide Bearer <apiKey> in Authorization header.',
    });
    return;
  }

  try {
    const member = await AuthService.verifyApiKey(apiKey);
    if (!member) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or inactive API key.',
      });
      return;
    }

    req.member = member;
    req.rawApiKey = apiKey;
    next();
  } catch (err: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify API key authentication.',
    });
  }
}

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'] || req.headers['x-api-key'];
  if (!authHeader) {
    return next();
  }

  let apiKey: string | undefined;
  if (typeof authHeader === 'string') {
    apiKey = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7).trim()
      : authHeader.trim();
  }

  if (apiKey) {
    try {
      const member = await AuthService.verifyApiKey(apiKey);
      if (member) {
        req.member = member;
        req.rawApiKey = apiKey;
      }
    } catch {
      // Ignore in optional mode
    }
  }

  next();
}
