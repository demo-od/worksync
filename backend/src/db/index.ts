import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

// The connection pool manages multiple simultaneous connections to your cloud database
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

// Initialize Drizzle with our connection pool and pass it our schema blueprint
export const db = drizzle(pool, { schema });