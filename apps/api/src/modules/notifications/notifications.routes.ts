import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { pushTokens } from "@/db/schema/push_tokens";
import { requireAuth } from "@/middlewares/session";
import { sendExpoPush } from "./expo";

const router = new Hono();

const UpsertTokenSchema = z.object({
  platform: z.enum(["ios", "android"]),
  expoPushToken: z.string().min(10),
  deviceId: z.string().min(1).optional().nullable(),
});

router.post("/push-tokens", requireAuth, zValidator("json", UpsertTokenSchema), async (c) => {
  const userId = c.get("userId")!;
  const body = c.req.valid("json");

  // Simplest: delete same token then insert new row (token count is small)
  await db.delete(pushTokens).where(eq(pushTokens.expoPushToken, body.expoPushToken));
  const [row] = await db
    .insert(pushTokens)
    .values({
      userId,
      platform: body.platform,
      expoPushToken: body.expoPushToken,
      deviceId: body.deviceId ?? null,
    })
    .returning();

  return c.json({ ok: true, pushToken: row });
});

router.post(
  "/test",
  requireAuth,
  zValidator(
    "json",
    z.object({
      title: z.string().min(1).default("BudgetCoach"),
      body: z.string().min(1).default("Test notification"),
    }),
  ),
  async (c) => {
    const userId = c.get("userId")!;
    const { title, body } = c.req.valid("json");

    const tokens = await db
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId))
      .orderBy(desc(pushTokens.updatedAt))
      .limit(10);

    if (tokens.length === 0) {
      return c.json({ ok: false, message: "No push tokens registered" }, 400);
    }

    const result = await sendExpoPush(
      tokens.map((t) => ({
        to: t.expoPushToken,
        title,
        body,
        data: { kind: "test" },
        sound: "default",
      })),
    );

    return c.json({ ok: true, result });
  },
);

export default router;

