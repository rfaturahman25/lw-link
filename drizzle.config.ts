import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/backend/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  driver: 'd1',
  
  // D1-specific configuration
  dbCredentials: {
    wranglerConfigPath: './wrangler.jsonc',
    dbName: 'lw-link-db',
  },
  
  // Migration settings
  verbose: true,
  strict: true,
  
  // Additional configuration
  casing: 'snake_case',
});