import path from 'path';
import dotenv from 'dotenv';

// Load .env file from apps/hub or workspace root if present
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export interface Config {
  port: number;
  host: string;
  nodeEnv: string;
  corsOrigin: string | string[];
  supabaseUrl?: string;
  supabaseKey?: string;
  useSupabase: boolean;
  dataFilePath: string;
  defaultBlockTtlHours: number;
  corroborationThreshold: number;
  multiReporterThreshold: number;
  corroborationWindowHours: number;
  sseHeartbeatIntervalMs: number;
  apiKeyPrefix: string;
  adminApiKey: string;
  version: string;
}

const parseCorsOrigin = (rawOrigin?: string): string | string[] => {
  if (!rawOrigin || rawOrigin === '*') return '*';
  if (rawOrigin.includes(',')) {
    return rawOrigin.split(',').map((s) => s.trim());
  }
  return rawOrigin;
};

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const config: Config = {
  port: parseInt(process.env.PORT || process.env.HUB_PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
  supabaseUrl,
  supabaseKey,
  useSupabase: Boolean(supabaseUrl && supabaseKey),
  dataFilePath: process.env.DATA_FILE_PATH || path.resolve(__dirname, '../../data/nexus_local.json'),
  defaultBlockTtlHours: parseInt(process.env.DEFAULT_BLOCK_TTL_HOURS || '24', 10),
  corroborationThreshold: parseFloat(process.env.CORROBORATION_THRESHOLD || '2.0'),
  multiReporterThreshold: parseFloat(process.env.MULTI_REPORTER_THRESHOLD || '1.2'),
  corroborationWindowHours: parseInt(process.env.CORROBORATION_WINDOW_HOURS || '24', 10),
  sseHeartbeatIntervalMs: parseInt(process.env.SSE_HEARTBEAT_INTERVAL_MS || '15000', 10),
  apiKeyPrefix: process.env.API_KEY_PREFIX || 'nx_live_',
  adminApiKey: process.env.ADMIN_API_KEY || 'nx_admin_master_key_2026',
  version: '1.0.0',
};

export default config;
