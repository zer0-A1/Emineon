import { Pool, PoolConfig } from 'pg';

// Helper function to determine if SSL should be used
function shouldUseSSL(connectionString?: string): boolean {
  if (!connectionString) return false;
  
  // Check if it's a localhost connection
  const isLocalhost = connectionString.includes('localhost') || 
                      connectionString.includes('127.0.0.1');
  
  // Check if it's a Neon connection or explicitly requires SSL
  const isNeon = connectionString.includes('neon.tech') ||
                 connectionString.includes('sslmode=require');
  
  // Use SSL for non-localhost connections or Neon
  return !isLocalhost || isNeon;
}

// Prefer pooled connection string; fallback to unpooled if necessary (e.g., misconfigured envs)
const resolvedConnectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;

// Create pool configuration
const poolConfig: PoolConfig = {
  connectionString: resolvedConnectionString,
  // In serverless environments, keep pools small to avoid exhausting Neon connections
  max: Number(process.env.PG_POOL_MAX || 5),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 10000),
  connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 2000),
};

// Only add SSL if needed
if (shouldUseSSL(resolvedConnectionString)) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

// Create connection pool
export const pool = new Pool(poolConfig);

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Helper function to run queries
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount });
    return res.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper function to get a client for transactions
export async function getClient() {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = () => {
    client.release();
  };

  // Override release to remove the client from the pool
  const removeFromPool = () => {
    client.release(true);
  };

  return {
    query,
    release,
    removeFromPool,
    client,
  };
}