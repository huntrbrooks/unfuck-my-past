// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: './src/db/schema.ts',   // where your tables live
  out: './drizzle',               // where SQL/migrations will be emitted
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!, // set in .env.local
  },
  verbose: true,
  strict: true,
});
