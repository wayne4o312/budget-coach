import * as Crypto from "expo-crypto";

import { getDb } from "@/src/db/db";

export type LocalTransactionRow = {
  id: string;
  kind: "expense" | "income";
  category: string;
  amount_cents: number;
  occurred_at: number;
};

function dayBoundsMs(d: Date): { start: number; end: number } {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

function monthBoundsMs(d: Date): { start: number; end: number } {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

export async function listTransactionsForDay(
  d: Date,
): Promise<LocalTransactionRow[]> {
  const { start, end } = dayBoundsMs(d);
  const db = await getDb();
  const rows = await db.getAllAsync<LocalTransactionRow>(
    `SELECT id, kind, category, amount_cents, occurred_at
     FROM transactions
     WHERE deleted_at IS NULL AND occurred_at >= ? AND occurred_at <= ?
     ORDER BY occurred_at DESC`,
    [start, end],
  );
  return rows ?? [];
}

export async function sumAmountCentsBetween(
  startMs: number,
  endMs: number,
  kind?: "expense" | "income",
): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ s: number | null }>(
    `SELECT COALESCE(SUM(amount_cents), 0) AS s
     FROM transactions
     WHERE deleted_at IS NULL
       AND occurred_at >= ? AND occurred_at <= ?
       AND (? IS NULL OR kind = ?)`,
    [startMs, endMs, kind ?? null, kind ?? null],
  );
  return row?.s ?? 0;
}

export async function sumTodaySpentCents(d: Date): Promise<number> {
  const { start, end } = dayBoundsMs(d);
  // kind 语义决定方向：这里只统计支出
  return await sumAmountCentsBetween(start, end, "expense");
}

export async function sumMonthSpentCents(d: Date): Promise<number> {
  const { start, end } = monthBoundsMs(d);
  return await sumAmountCentsBetween(start, end, "expense");
}

export async function insertQuickTransaction(input: {
  kind: "expense" | "income";
  category: string;
  /** 正元，内部存为正分；方向由 kind 决定 */
  amountYuan: number;
  userId: string | null;
}): Promise<void> {
  const db = await getDb();
  const id = Crypto.randomUUID();
  const now = Date.now();
  const amountCents = Math.round(input.amountYuan * 100);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error("Invalid amount");
  }
  await db.runAsync(
    `INSERT INTO transactions (
       id, user_id, kind, amount_cents, currency, category, scene, occurred_at, note, deleted_at, updated_at
     ) VALUES (?, ?, ?, ?, 'CNY', ?, 'quick_entry', ?, NULL, NULL, ?)`,
    [id, input.userId, input.kind, amountCents, input.category, now, now],
  );
}

// Back-compat (temporary): keep old call sites compiling until they are migrated.
export async function insertQuickExpense(input: {
  category: string;
  /** 支出为正元（历史接口），现内部存为正分 */
  spendAmountYuan: number;
  userId: string | null;
}): Promise<void> {
  return await insertQuickTransaction({
    kind: "expense",
    category: input.category,
    amountYuan: input.spendAmountYuan,
    userId: input.userId,
  });
}

export async function softDeleteTransaction(id: string): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.runAsync(
    `UPDATE transactions
     SET deleted_at = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [now, now, id],
  );
}
