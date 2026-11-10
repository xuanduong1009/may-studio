/**
 * Sets a new password for an existing account and signs it out everywhere.
 * Usage: npx tsx scripts/set-password.ts <email> <new-password>
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // rely on real environment variables
}

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 8) {
    console.error("Usage: npx tsx scripts/set-password.ts <email> <new-password (8+ chars)>");
    process.exit(1);
  }
  const { db } = await import("../src/lib/db");
  const s = await import("../src/lib/db/schema");
  const { hashPassword } = await import("better-auth/crypto");
  const { and, eq } = await import("drizzle-orm");

  const user = await db.query.user.findFirst({ where: eq(s.user.email, email.toLowerCase()) });
  if (!user) throw new Error(`No account for ${email}`);
  const updated = await db
    .update(s.account)
    .set({ password: await hashPassword(password) })
    .where(and(eq(s.account.userId, user.id), eq(s.account.providerId, "credential")))
    .returning({ id: s.account.id });
  if (!updated.length) throw new Error(`${email} has no email/password login`);
  await db.delete(s.session).where(eq(s.session.userId, user.id));
  console.log(`✓ Password updated for ${email}; existing sessions were signed out.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });

export {};
