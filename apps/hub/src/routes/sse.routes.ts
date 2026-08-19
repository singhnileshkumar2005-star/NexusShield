import { Router, Request, Response } from 'express';
import { SseService } from '../services/sse.service';

const router = Router();

/**
 * GET /v1/events
 * Real-time Server-Sent Events stream for connected agents, dashboards, and watchers.
 * Broadcasts:
 *  - block_added: new malicious IP added to network blocklist
 *  - block_updated: updated confidence/corroboration count
 *  - block_removed: revoked/expired IP
 *  - threat_reported: live telemetry pulse
 *  - ping: periodic keep-alive
 */
router.get('/', (req: Request, res: Response) => {
  SseService.registerClient(req, res);
});

export default router;
