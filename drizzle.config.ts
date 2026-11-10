import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — rely on real environment variables
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  },
});
