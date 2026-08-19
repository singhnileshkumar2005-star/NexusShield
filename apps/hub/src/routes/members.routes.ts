import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /v1/members
 * Lists all registered nodes/members in the mesh (sanitized).
 */
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const members = await AuthService.listMembers();

    res.status(200).json({
      count: members.length,
      timestamp: new Date().toISOString(),
      members,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Members Query Error',
      message: err.message || 'Failed to list mesh members.',
    });
  }
});

/**
 * GET /v1/members/:id
 * Retrieves sanitized profile for a specific member node
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const member = await AuthService.getMemberById(id);

    if (!member) {
      res.status(404).json({
        error: 'Not Found',
        message: `Member ${id} not found.`,
      });
      return;
    }

    res.status(200).json({ member });
  } catch (err: any) {
    res.status(500).json({
      error: 'Member Query Error',
      message: err.message || 'Failed to retrieve member.',
    });
  }
});

export default router;
