import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.CONNECTION_STRING) {
  throw new Error('CONNECTION_STRING environment variable is not defined');
}

export const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  },
  // Connection pool settings for production
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log successful connection
pool.on('connect', () => {
  console.log('Database connected successfully');
});

// Handle connection errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});