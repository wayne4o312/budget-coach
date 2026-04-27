import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { readEnv } from "../env";

const env = readEnv();

let pool: Pool | null = null;

export function getPool() {
  if (!env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL");
  }
  if (!pool) {
    pool = new Pool({ connectionString: env.DATABASE_URL });
  }
  return pool;
}

export const db = drizzle(getPool());

