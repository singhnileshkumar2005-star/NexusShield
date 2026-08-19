import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { BlocklistService } from '../services/blocklist.service';

const router = Router();

/**
 * GET /v1/allowlist
 * Lists all custom allowlist/whitelist rules configured for the authenticated site.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const member = req.member!;
    const allowlist = await BlocklistService.getAllowlist(member.id);

    res.status(200).json({
      memberId: member.id,
      count: allowlist.length,
      allowlist: allowlist.map((item) => ({
        id: item.id,
        ipOrCidr: item.ip_or_cidr,
        description: item.description,
        createdAt: item.created_at,
      })),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Allowlist Query Error',
      message: err.message || 'Failed to fetch allowlist entries.',
    });
  }
});

/**
 * POST /v1/allowlist
 * Creates a new custom allowlist rule (IP or CIDR) for the site.
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const member = req.member!;
    const { ipOrCidr, description } = req.body || {};

    if (!ipOrCidr || typeof ipOrCidr !== 'string' || ipOrCidr.trim().length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Field "ipOrCidr" is required and must be an IP or CIDR notation.',
      });
      return;
    }

    const entry = await BlocklistService.addAllowlistEntry(
      member.id,
      ipOrCidr,
      description
    );

    res.status(201).json({
      id: entry.id,
      memberId: member.id,
      ipOrCidr: entry.ip_or_cidr,
      description: entry.description,
      createdAt: entry.created_at,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Allowlist Creation Error',
      message: err.message || 'Failed to create allowlist entry.',
    });
  }
});

/**
 * DELETE /v1/allowlist/:id
 * Removes a custom allowlist rule by ID.
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const member = req.member!;
    const { id } = req.params;

    const deleted = await BlocklistService.deleteAllowlistEntry(member.id, id);

    if (!deleted) {
      res.status(404).json({
        error: 'Not Found',
        message: `Allowlist entry with ID ${id} was not found for this member.`,
      });
      return;
    }

    res.status(200).json({
      deleted: true,
      id,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Allowlist Deletion Error',
      message: err.message || 'Failed to delete allowlist entry.',
    });
  }
});

export default router;
