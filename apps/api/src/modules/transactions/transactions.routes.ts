import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { and, asc, eq, gt, isNull } from "drizzle-orm";

import { db } from "@/db/client";
import { transactions } from "@/db/schema/transactions";
import { requireAuth } from "@/middlewares/session";

const router = new Hono();

const CreateTxSchema = z.object({
  kind: z.enum(["expense", "income"]).default("expense"),
  amountCents: z.number().int().positive(),
  currency: z.string().min(1).default("CNY"),
  category: z.string().min(1),
  scene: z.string().min(1),
  occurredAt: z.string().datetime(),
  note: z.string().optional().nullable(),
});

router.post("/", requireAuth, zValidator("json", CreateTxSchema), async (c) => {
  const userId = c.get("userId")!;
  const body = c.req.valid("json");
  const [row] = await db
    .insert(transactions)
    .values({
      userId,
      kind: body.kind,
      amountCents: body.amountCents,
      currency: body.currency,
      category: body.category,
      scene: body.scene,
      occurredAt: new Date(body.occurredAt),
      note: body.note ?? null,
    })
    .returning();

  return c.json({ ok: true, transaction: row });
});

router.get("/", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const since = c.req.query("since");
  const sinceDate = since ? new Date(since) : null;

  const rows = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        isNull(transactions.deletedAt),
        sinceDate ? gt(transactions.updatedAt, sinceDate) : undefined,
      ),
    )
    .orderBy(asc(transactions.occurredAt));

  return c.json({ ok: true, transactions: rows });
});

export default router;

