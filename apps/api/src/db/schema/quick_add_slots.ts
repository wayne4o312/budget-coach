import { pgTable, text, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";

export const quickAddSlots = pgTable("quick_add_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  position: integer("position").notNull(),
  kind: text("kind").notNull(), // 'scene' | 'custom'
  sceneId: text("scene_id"),
  customTitle: text("custom_title"),
  customCategory: text("custom_category"),
  customIcon: text("custom_icon"),
  suggestedAmounts: jsonb("suggested_amounts").notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

