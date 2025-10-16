require('dotenv').config({ path: '.env.local' });

console.log('🔍 Checking environment variables...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  console.log('\nPlease make sure you have a .env.local file with DATABASE_URL set to your Neon connection string.');
  console.log('\nExample:');
  console.log('DATABASE_URL=postgresql://neondb_owner:npg_kDYdf2A7rmNz@ep-jolly-shadow-agc4ewcs-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require');
  process.exit(1);
}

console.log('✅ DATABASE_URL is set');

// Test the connection
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    const client = await pool.connect();
    
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('Server time:', result.rows[0].now);
    
    // Check if candidates table exists
    const tableCheck = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'candidates')"
    );
    console.log('Candidates table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      const countResult = await client.query('SELECT COUNT(*) FROM candidates');
      console.log('Number of candidates:', countResult.rows[0].count);
    }
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
