import { Router, Request, Response } from 'express';
import { BlocklistService } from '../services/blocklist.service';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /v1/blocklist
 * Public/Protected query for active network blocklist entries.
 * Supports delta sync via `since` ISO timestamp or unix ms.
 */
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const sinceParam = req.query.since as string | undefined;
    let sinceIso: string | undefined;

    if (sinceParam) {
      // Check if unix timestamp (number) or ISO string
      if (/^\d+$/.test(sinceParam)) {
        sinceIso = new Date(parseInt(sinceParam, 10)).toISOString();
      } else {
        const parsed = new Date(sinceParam);
        if (!isNaN(parsed.getTime())) {
          sinceIso = parsed.toISOString();
        }
      }
    }

    const blocks = await BlocklistService.getActiveBlocklist(sinceIso);

    res.status(200).json({
      count: blocks.length,
      timestamp: new Date().toISOString(),
      blocks: blocks.map((b) => ({
        ip: b.attacker_ip,
        category: b.primary_category,
        confidence: b.confidence,
        corroborationCount: b.corroboration_count,
        expiresAt: b.expires_at,
        firstDetected: b.first_detected,
        updatedAt: b.updated_at,
      })),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Blocklist Query Error',
      message: err.message || 'Failed to fetch active blocklist.',
    });
  }
});

/**
 * GET /v1/blocklist/check/:ip
 * Checks if a specific IP is currently blocked
 */
router.get('/check/:ip', async (req: Request, res: Response) => {
  try {
    const { ip } = req.params;
    const { blocked, entry } = await BlocklistService.isIpBlocked(ip);

    res.status(200).json({
      ip,
      isBlocked: blocked,
      entry: entry
        ? {
            category: entry.primary_category,
            confidence: entry.confidence,
            corroborationCount: entry.corroboration_count,
            expiresAt: entry.expires_at,
          }
        : null,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Block Check Error',
      message: err.message || 'Failed to check IP block status.',
    });
  }
});

/**
 * POST /v1/blocklist/revoke
 * Revokes / unblocks an IP from the network blocklist (Admin or authorized node)
 */
router.post('/revoke', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { ip, reason } = req.body || {};

    if (!ip || typeof ip !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Field "ip" is required.',
      });
      return;
    }

    const revoked = await BlocklistService.revokeBlock(ip, reason);

    if (!revoked) {
      res.status(404).json({
        error: 'Not Found',
        message: `IP ${ip} was not found on the active blocklist.`,
      });
      return;
    }

    res.status(200).json({
      revoked: true,
      ip,
      reason: reason || 'Manual revocation',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Revocation Error',
      message: err.message || 'Failed to revoke IP block.',
    });
  }
});

export default router;
