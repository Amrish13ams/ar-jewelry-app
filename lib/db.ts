import { Pool } from 'pg';

// This establishes a connection pool to your PostgreSQL database.
// Make sure you have DATABASE_URL defined in your .env.local file.
// Example: DATABASE_URL="postgresql://user:password@localhost:5432/jewelry_db"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // If you are connecting to a hosted DB (like Supabase/Neon), you often need SSL:
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

export default pool;