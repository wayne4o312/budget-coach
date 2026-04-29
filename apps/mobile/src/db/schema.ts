export const DB_NAME = 'budgetcoach.db';
export const DB_VERSION = 3;

export const CREATE_TABLES_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  kind TEXT NOT NULL DEFAULT 'expense',
  category TEXT NOT NULL,
  scene TEXT NOT NULL,
  occurred_at INTEGER NOT NULL,
  note TEXT,
  deleted_at INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_time
  ON transactions(user_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_transactions_updated
  ON transactions(updated_at);

CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT,
  monthly_saving_goal_cents INTEGER NOT NULL DEFAULT 0,
  budget_mode TEXT NOT NULL DEFAULT 'manual_spend_cap',
  monthly_spend_cap_cents INTEGER NOT NULL DEFAULT 0,
  monthly_income_cents INTEGER NOT NULL DEFAULT 0,
  reward_ratio REAL NOT NULL DEFAULT 0.1,
  reminder_rules_json TEXT NOT NULL DEFAULT '[]',
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_user
  ON user_settings(user_id);

CREATE TABLE IF NOT EXISTS sync_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quick_add_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('scene','custom')),
  scene_id TEXT,
  custom_title TEXT,
  custom_category TEXT,
  custom_icon TEXT,
  suggested_amounts_json TEXT NOT NULL DEFAULT '[]',
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quick_add_slots_position
  ON quick_add_slots(position);
`;

