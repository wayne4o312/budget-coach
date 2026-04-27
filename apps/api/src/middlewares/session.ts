import type { MiddlewareHandler } from "hono";
import { eq } from "drizzle-orm";

import { auth } from "@/auth/auth";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

declare module "hono" {
  interface ContextVariableMap {
    userId: string | null;
    session: unknown | null;
    user: unknown | null;
  }
}

type BetterAuthSessionResult = {
  user?: { id?: string } | null;
  session?: unknown | null;
} | null;

export const sessionMiddleware: MiddlewareHandler = async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
    query: {
      disableCookieCache: false,
      disableRefresh: true,
    },
  });
  const s = session as unknown as BetterAuthSessionResult;

  const userId = s?.user?.id ?? null;
  c.set("userId", userId);
  c.set("session", s?.session ?? null);
  c.set("user", s?.user ?? null);

  // Soft-deactivated users are treated as signed-out for all API routes.
  if (userId) {
    const u = await db
      .select({ deletedAt: schema.user.deletedAt })
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);
    if (u[0]?.deletedAt) {
      c.set("userId", null);
      c.set("session", null);
      c.set("user", null);
    }
  }
  await next();
};

export const requireAuth: MiddlewareHandler = async (c, next) => {
  if (!c.get("userId")) {
    return c.json({ ok: false, message: "Not authenticated" }, 401);
  }
  await next();
};

