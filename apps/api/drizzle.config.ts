import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// Load repo-root .env (../.. from apps/api/drizzle.config.ts)
dotenv.config({ path: new URL("../../.env", import.meta.url) });

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});

