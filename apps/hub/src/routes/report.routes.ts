import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { CorroborationService } from '../services/corroboration.service';

const router = Router();

/**
 * POST /v1/report
 * Ingests an anonymized threat report from an authenticated agent node.
 * Evaluates dynamic risk weighting and corroboration.
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { ip, category, confidence } = req.body || {};

    if (!ip || typeof ip !== 'string' || ip.trim().length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Field "ip" is required and must be a valid IP address.',
      });
      return;
    }

    const member = req.member!;
    const result = await CorroborationService.processReport(member, {
      ip,
      category,
      confidence: typeof confidence === 'number' ? confidence : undefined,
    });

    res.status(202).json({
      accepted: true,
      attackerIp: result.attackerIp,
      threatScore: result.threatScore,
      distinctReporters: result.distinctReporters,
      isPromoted: result.isPromoted,
      action: result.action,
      reason: result.reason,
      blocklistEntry: result.blocklistEntry,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Report Processing Error',
      message: err.message || 'Failed to process threat report.',
    });
  }
});

export default router;
