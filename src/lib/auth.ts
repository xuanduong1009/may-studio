import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

/** Public demo accounts: their password is printed in the README, so it must not change. */
const LOCKED_EMAILS = ["demo@may.studio", "viewer@may.studio"];

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const auth = betterAuth({
  appName: "MÂY Studio",
  // falls back to the Vercel production domain, so a fresh deploy works without extra settings
  baseURL:
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined),
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
    resetPasswordTokenExpiresIn: 3600,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      // loaded lazily so scripts that import auth (the seed) don't pull in server-only modules
      const { sendEmail, resetPasswordEmail } = await import("@/lib/email");
      await sendEmail(resetPasswordEmail(user.email, user.name, url));
      if (!process.env.RESEND_API_KEY) console.info(`[email:dev] reset link for ${user.email}: ${url}`);
    },
  },
  // brute-force protection on the sensitive endpoints
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 300, max: 3 },
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "user", input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Emails listed in ADMIN_EMAILS become admins when they sign up.
        before: async (u) => ({
          data: { ...u, role: adminEmails().includes(u.email.toLowerCase()) ? "admin" : "user" },
        }),
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/change-password") return;
      const session = await getSessionFromCtx(ctx);
      if (session && LOCKED_EMAILS.includes(session.user.email.toLowerCase())) {
        throw new APIError("FORBIDDEN", { message: "Demo accounts cannot change their password" });
      }
    }),
  },
  // must be the last plugin: lets server actions set auth cookies
  plugins: [nextCookies()],
});
