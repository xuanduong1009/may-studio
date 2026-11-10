import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/lib/auth";

/** Session for the current request (deduplicated per render). */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export type Session = Awaited<ReturnType<typeof getSession>>;

/** Full admin: can change data. */
export function isAdmin(session: Session) {
  return session?.user.role === "admin";
}

/** Admin or read-only "viewer" (the public demo account): can open the dashboard. */
export function canViewAdmin(session: Session) {
  return session?.user.role === "admin" || session?.user.role === "viewer";
}

/** Throws unless the current user is an admin. Use at the top of every admin server action. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdmin(session)) throw new Error("UNAUTHORIZED");
  return session;
}
