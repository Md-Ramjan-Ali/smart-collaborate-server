import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import config from '../config';

// Initialize PostgreSQL connection pool using pg
const pool = new Pool({
  connectionString: config.database_url,
});

// Create Prisma PG adapter for compatibility with Prisma 7
const adapter = new PrismaPg(pool);

// Export single PrismaClient instance
export const prisma = new PrismaClient({ adapter });

export default prisma;
