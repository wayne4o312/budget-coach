import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const pushTokens = pgTable(
  "push_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    platform: text("platform").notNull(), // ios | android
    expoPushToken: text("expo_push_token").notNull(),
    deviceId: text("device_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("idx_push_tokens_user").on(t.userId),
    tokenIdx: index("idx_push_tokens_token").on(t.expoPushToken),
  }),
);

