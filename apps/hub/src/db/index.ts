import config from '../config';
import { NexusDataStore } from './store';
import { LocalDataStore } from './local-store';
import { SupabaseDataStore } from './supabase-store';

let storeInstance: NexusDataStore | null = null;

export async function getDataStore(): Promise<NexusDataStore> {
  if (storeInstance) {
    return storeInstance;
  }

  if (config.useSupabase && config.supabaseUrl && config.supabaseKey) {
    console.log('🔗 Initializing Supabase DataStore mode...');
    storeInstance = new SupabaseDataStore(config.supabaseUrl, config.supabaseKey);
  } else {
    console.log(`📁 Initializing Local Zero-Config DataStore mode (${config.dataFilePath})...`);
    storeInstance = new LocalDataStore(config.dataFilePath);
  }

  await storeInstance.init();
  return storeInstance;
}

export * from './store';
export * from './local-store';
export * from './supabase-store';
export * from './seed';
