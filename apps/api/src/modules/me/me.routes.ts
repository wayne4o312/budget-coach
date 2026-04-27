import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { requireAuth } from "@/middlewares/session";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

const router = new Hono();

router.get("/", requireAuth, async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ ok: false, message: "Not authenticated" }, 401);
  const rows = await db
    .select({
      id: schema.user.id,
      email: schema.user.email,
      name: schema.user.name,
      nickname: schema.user.nickname,
      title: schema.user.title,
      image: schema.user.image,
      emailVerified: schema.user.emailVerified,
      deletedAt: schema.user.deletedAt,
      createdAt: schema.user.createdAt,
      updatedAt: schema.user.updatedAt,
    })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  return c.json({ ok: true, user: rows[0] ?? null });
});

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  nickname: z.string().min(1).max(30).optional(),
  title: z.string().min(1).max(30).optional(),
  image: z.string().url().optional().nullable(),
});

router.patch("/", requireAuth, zValidator("json", UpdateProfileSchema), async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ ok: false, message: "Not authenticated" }, 401);
  const body = c.req.valid("json");

  const nextName =
    body.nickname !== undefined
      ? body.nickname
      : body.name !== undefined
        ? body.name
        : undefined;

  await db
    .update(schema.user)
    .set({
      ...(nextName !== undefined ? { name: nextName } : {}),
      ...(body.nickname !== undefined ? { nickname: body.nickname } : {}),
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.image !== undefined ? { image: body.image } : {}),
    })
    .where(eq(schema.user.id, userId));

  return c.json({ ok: true });
});

router.post("/deactivate", requireAuth, async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ ok: false, message: "Not authenticated" }, 401);
  const now = new Date();

  await db.update(schema.user).set({ deletedAt: now }).where(eq(schema.user.id, userId));
  await db.delete(schema.session).where(eq(schema.session.userId, userId));

  return c.json({ ok: true, deletedAt: now.toISOString() });
});

export default router;

