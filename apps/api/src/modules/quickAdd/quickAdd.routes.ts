import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { db } from "@/db/client";
import { quickAddSlots } from "@/db/schema/quick_add_slots";
import { requireAuth } from "@/middlewares/session";
import { and, asc, eq } from "drizzle-orm";

const router = new Hono();

const SlotSchema = z.object({
  position: z.number().int().min(0),
  kind: z.enum(["scene", "custom"]),
  sceneId: z.string().min(1).optional().nullable(),
  customTitle: z.string().min(1).optional().nullable(),
  customCategory: z.string().min(1).optional().nullable(),
  customIcon: z.string().min(1).optional().nullable(),
  suggestedAmounts: z.array(z.number().int().positive()).default([]),
});

const SlotsSchema = z.object({
  slots: z.array(SlotSchema).min(1),
});

function defaultSlots() {
  return [
    { position: 0, kind: "scene", sceneId: "coffee", suggestedAmounts: [] },
    { position: 1, kind: "scene", sceneId: "lunch", suggestedAmounts: [] },
    { position: 2, kind: "scene", sceneId: "commute", suggestedAmounts: [] },
    {
      position: 3,
      kind: "custom",
      customTitle: "Custom",
      customCategory: "其他",
      customIcon: "notebook-pen",
      suggestedAmounts: [10, 20, 50, 100],
    },
  ];
}

router.get("/slots", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const rows = await db
    .select()
    .from(quickAddSlots)
    .where(eq(quickAddSlots.userId, userId))
    .orderBy(asc(quickAddSlots.position));

  if (rows.length === 0) {
    // insert defaults
    const d = defaultSlots();
    await db.insert(quickAddSlots).values(
      d.map((s) => ({
        userId,
        position: s.position,
        kind: s.kind,
        sceneId: "sceneId" in s ? (s.sceneId as string) : null,
        customTitle: "customTitle" in s ? (s.customTitle as string) : null,
        customCategory: "customCategory" in s ? (s.customCategory as string) : null,
        customIcon: "customIcon" in s ? (s.customIcon as string) : null,
        suggestedAmounts: s.kind === "custom" ? [...(s.suggestedAmounts as number[])] : [],
      })),
    );
    return c.json({ ok: true, slots: d });
  }

  return c.json({
    ok: true,
    slots: rows.map((r) => ({
      position: r.position,
      kind: r.kind,
      sceneId: r.sceneId ?? null,
      customTitle: r.customTitle ?? null,
      customCategory: r.customCategory ?? null,
      customIcon: r.customIcon ?? null,
      suggestedAmounts: (r.suggestedAmounts as unknown as number[]) ?? [],
    })),
  });
});

router.put(
  "/slots",
  requireAuth,
  zValidator("json", SlotsSchema),
  async (c) => {
    const userId = c.get("userId")!;
    const { slots } = c.req.valid("json");

    // normalize: sort, re-index positions
    const normalized = slots
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((s, idx) => ({ ...s, position: idx }));

    // replace all
    await db.delete(quickAddSlots).where(eq(quickAddSlots.userId, userId));
    await db.insert(quickAddSlots).values(
      normalized.map((s) => ({
        userId,
        position: s.position,
        kind: s.kind,
        sceneId: s.kind === "scene" ? (s.sceneId ?? null) : null,
        customTitle: s.kind === "custom" ? (s.customTitle ?? "Custom") : null,
        customCategory: s.kind === "custom" ? (s.customCategory ?? "其他") : null,
        customIcon: s.kind === "custom" ? (s.customIcon ?? "notebook-pen") : null,
        suggestedAmounts: s.kind === "custom" ? s.suggestedAmounts : [],
      })),
    );

    return c.json({ ok: true, slots: normalized });
  },
);

export default router;

