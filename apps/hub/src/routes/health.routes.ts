import { Router, Request, Response } from 'express';
import config from '../config';
import { SseService } from '../services/sse.service';
import { BlocklistService } from '../services/blocklist.service';

const router = Router();
const startTime = Date.now();

router.get('/', async (req: Request, res: Response) => {
  try {
    const activeBlocks = await BlocklistService.getActiveBlocklist();
    const uptime = Math.floor((Date.now() - startTime) / 1000);

    res.status(200).json({
      status: 'ok',
      service: 'nexus-hub',
      version: config.version,
      mode: config.useSupabase ? 'supabase' : 'local-zeroconfig',
      uptimeSeconds: uptime,
      activeSseClients: SseService.getActiveClientsCount(),
      activeBlockedIps: activeBlocks.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(200).json({
      status: 'degraded',
      service: 'nexus-hub',
      version: config.version,
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
