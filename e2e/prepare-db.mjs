// Creates a fresh, seeded SQLite database (e2e.db, git-ignored) before the test server starts,
// so every run begins from the same data and never touches local.db or production.
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

for (const file of ["e2e.db", "e2e.db-journal", "e2e.db-wal", "e2e.db-shm"]) rmSync(file, { force: true });

const env = { ...process.env, DATABASE_URL: "file:e2e.db" };
execSync("npx drizzle-kit push --force", { env, stdio: "inherit" });
execSync("npx tsx scripts/seed.ts", { env, stdio: "inherit" });
