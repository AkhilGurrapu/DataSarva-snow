import { IStorage, MemStorage } from './storage';
import { SnowflakeStorage } from './snowflake-storage';
import { SnowflakeConnection } from '@shared/schema';

// Storage type configuration
export type StorageType = 'memory' | 'snowflake';

/**
 * Factory function to create storage instance based on configuration
 */
export async function createStorage(type: StorageType, config?: any): Promise<IStorage> {
  switch (type) {
    case 'memory':
      return new MemStorage();
      
    case 'snowflake':
      if (!config) {
        throw new Error('Snowflake configuration required');
      }
      
      const snowflakeStorage = new SnowflakeStorage(config as SnowflakeConnection);
      
      // Initialize connection and tables
      await snowflakeStorage.initializeConnection();
      await snowflakeStorage.initializeTables();
      
      return snowflakeStorage;
      
    default:
      console.warn(`Unknown storage type "${type}", falling back to memory storage`);
      return new MemStorage();
  }
}

// Default storage instance - initialized in index.ts
let storage: IStorage | null = null;

/**
 * Initialize the application storage
 */
export async function initializeStorage(): Promise<IStorage> {
  // Check if we have environment variables for Snowflake
  const useSnowflake = process.env.USE_SNOWFLAKE === 'true';
  
  if (useSnowflake) {
    // Get Snowflake configuration from environment
    const snowflakeConfig: SnowflakeConnection = {
      id: 0, // Will be ignored for initialization
      userId: 0, // Will be ignored for initialization
      name: 'App Storage',
      account: process.env.SNOWFLAKE_ACCOUNT || '',
      username: process.env.SNOWFLAKE_USERNAME || '',
      password: process.env.SNOWFLAKE_PASSWORD || '',
      role: process.env.SNOWFLAKE_ROLE || 'ACCOUNTADMIN',
      warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
      isActive: true,
      createdAt: new Date()
    };
    
    console.log('Initializing Snowflake storage...');
    storage = await createStorage('snowflake', snowflakeConfig);
    console.log('Snowflake storage initialized successfully');
  } else {
    console.log('Initializing in-memory storage...');
    storage = await createStorage('memory');
    console.log('In-memory storage initialized successfully');
  }
  
  return storage;
}

/**
 * Get the initialized storage instance
 */
export function getStorage(): IStorage {
  if (!storage) {
    throw new Error('Storage not initialized. Call initializeStorage() first.');
  }
  
  return storage;
}