import * as SQLite from 'expo-sqlite';

import { CREATE_TABLES_SQL, DB_NAME, DB_VERSION } from './schema';

export type Db = SQLite.SQLiteDatabase;

let dbPromise: Promise<Db> | null = null;

async function migrateIfNeeded(db: Db) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= DB_VERSION) return;

  // v2: add transactions.kind and normalize historical negative amounts.
  if (current < 2) {
    try {
      await db.execAsync(
        `ALTER TABLE transactions ADD COLUMN kind TEXT NOT NULL DEFAULT 'expense';`,
      );
    } catch {
      // Column may already exist (e.g. after reinstall or partial migration).
    }
    // Historical data stored expenses as negative cents; normalize to positive.
    await db.execAsync(
      `UPDATE transactions
       SET amount_cents = ABS(amount_cents),
           kind = 'expense'
       WHERE kind IS NULL OR kind = '';`,
    );
  }

  // v3: ensure legacy negative amounts are fully normalized even if kind was backfilled.
  if (current < 3) {
    await db.execAsync(
      `UPDATE transactions
       SET amount_cents = ABS(amount_cents)
       WHERE amount_cents < 0;`,
    );
    await db.execAsync(
      `UPDATE transactions
       SET kind = 'expense'
       WHERE kind IS NULL OR kind = '';`,
    );
  }

  await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
}

export async function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(CREATE_TABLES_SQL);
      await migrateIfNeeded(db);
      return db;
    })();
  }
  return dbPromise;
}

