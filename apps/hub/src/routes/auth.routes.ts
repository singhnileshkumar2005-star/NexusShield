import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /v1/auth/register
 * Registers a new website / node in the mesh and issues an API key
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { siteName, siteUrl } = req.body || {};

    if (!siteName || typeof siteName !== 'string' || siteName.trim().length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Field "siteName" is required and must be a non-empty string.',
      });
      return;
    }

    const { member, apiKey } = await AuthService.registerMember({
      siteName,
      siteUrl,
    });

    res.status(201).json({
      memberId: member.id,
      apiKey,
      siteName: member.site_name,
      siteUrl: member.site_url,
      reputationScore: member.reputation_score,
      createdAt: member.created_at,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Registration Failed',
      message: err.message || 'Could not register new member node.',
    });
  }
});

/**
 * POST /v1/auth/verify
 * Validates an API key and returns member profile
 */
router.post('/verify', requireAuth, async (req: Request, res: Response) => {
  if (!req.member) {
    res.status(401).json({ valid: false, error: 'Unauthorized' });
    return;
  }

  res.status(200).json({
    valid: true,
    member: AuthService.sanitizeMember(req.member),
  });
});

export default router;
