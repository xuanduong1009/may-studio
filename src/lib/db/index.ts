import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * Local development uses a SQLite file (file:local.db).
 * Production (Vercel) uses a hosted Turso/libSQL database:
 *   DATABASE_URL=libsql://<db>.turso.io  DATABASE_AUTH_TOKEN=<token>
 */
const globalForDb = globalThis as unknown as { libsql?: ReturnType<typeof createClient> };

const client =
  globalForDb.libsql ??
  createClient({
    url: process.env.DATABASE_URL ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });

if (process.env.NODE_ENV !== "production") globalForDb.libsql = client;

export const db = drizzle(client, { schema });
export { schema };
