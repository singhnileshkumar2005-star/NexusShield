import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { TelemetryService } from '../services/telemetry.service';

const router = Router();

/**
 * POST /v1/heartbeat
 * Heartbeat check-in from active site agents.
 * Reports node health and telemetry count increments.
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const member = req.member!;
    const { mitigatedCount, blockedIp, threatCategory } = req.body || {};

    const countIncrement = typeof mitigatedCount === 'number' && mitigatedCount > 0 ? mitigatedCount : 0;

    // If specific mitigation telemetry was attached
    if (blockedIp && threatCategory) {
      await TelemetryService.recordMitigation(
        member.id,
        String(blockedIp),
        String(threatCategory)
      );
    } else {
      await TelemetryService.recordHeartbeat(member.id, countIncrement);
    }

    res.status(200).json({
      ok: true,
      memberId: member.id,
      siteName: member.site_name,
      lastHeartbeat: new Date().toISOString(),
      totalMitigations: (member.total_mitigations || 0) + countIncrement,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Heartbeat Processing Error',
      message: err.message || 'Failed to record agent heartbeat.',
    });
  }
});

export default router;
