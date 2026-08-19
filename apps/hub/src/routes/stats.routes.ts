import { Router, Request, Response } from 'express';
import { TelemetryService } from '../services/telemetry.service';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /v1/stats/network
 * Public aggregate mesh statistics for admin dashboards, transparency status, and landing page.
 * Strictly non-identifying (no member URLs or private endpoints).
 */
router.get('/network', async (req: Request, res: Response) => {
  try {
    const stats = await TelemetryService.getNetworkStats();
    res.status(200).json(stats);
  } catch (err: any) {
    res.status(500).json({
      error: 'Network Stats Error',
      message: err.message || 'Failed to aggregate network statistics.',
    });
  }
});

/**
 * GET /v1/stats/site
 * Authenticated site-specific dashboard metrics for a site owner.
 */
router.get('/site', requireAuth, async (req: Request, res: Response) => {
  try {
    const member = req.member!;
    const stats = await TelemetryService.getSiteStats(member.id);

    if (!stats) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Site telemetry record not found.',
      });
      return;
    }

    res.status(200).json(stats);
  } catch (err: any) {
    res.status(500).json({
      error: 'Site Stats Error',
      message: err.message || 'Failed to retrieve site statistics.',
    });
  }
});

export default router;
