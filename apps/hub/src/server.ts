import config from './config';
import { createApp } from './app';
import { getDataStore } from './db';
import { BlocklistService } from './services/blocklist.service';
import { SseService } from './services/sse.service';

async function bootstrap() {
  console.log('🛡️ Starting NexusSecure Hub Coordinator...');

  // Initialize DB layer (Supabase or Local zero-config)
  const store = await getDataStore();
  console.log('✅ Database layer initialized.');

  // Initialize SSE service
  SseService.init();

  // Periodic cleanup of expired blocks (every 10 minutes)
  const cleanupTimer = setInterval(async () => {
    try {
      const expiredCount = await BlocklistService.cleanupExpiredBlocks();
      if (expiredCount > 0) {
        console.log(`🧹 Cleaned up ${expiredCount} expired blocklist entries.`);
      }
    } catch (err) {
      console.warn('⚠️ Expired blocks cleanup failed:', err);
    }
  }, 10 * 60 * 1000);

  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  const app = createApp();

  const server = app.listen(config.port, config.host, () => {
    console.log(`
==============================================================================
   🛡️  NexusSecure Hub Coordinator running on http://${config.host}:${config.port}
==============================================================================
   Mode:       ${config.useSupabase ? 'Supabase Cloud Adapter' : 'Zero-Config Local File/Memory Store'}
   Data Path:  ${config.dataFilePath}
   Health:     http://localhost:${config.port}/health
   Blocklist:  http://localhost:${config.port}/v1/blocklist
   SSE Stream: http://localhost:${config.port}/v1/events
   Stats:      http://localhost:${config.port}/v1/stats/network
==============================================================================
    `);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Gracefully shutting down NexusSecure Hub...');
    clearInterval(cleanupTimer);
    server.close(() => {
      console.log('🔒 NexusSecure Hub stopped.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('💥 Fatal error starting NexusSecure Hub:', err);
  process.exit(1);
});
