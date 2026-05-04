import { getDb } from "@/src/db/db";
import { displayLabelForStoredCategory } from "@/src/domain/spendCategories";

export type Granularity = "day" | "week" | "month" | "year";
export type TxKind = "expense" | "income";

export type Range = {
  startMs: number;
  endMs: number;
};

export type LedgerSummary = {
  expenseCents: number;
  incomeCents: number;
  netCents: number;
};

export type TrendPoint = {
  label: string;
  value: number;
};

export type CategoryPoint = {
  label: string;
  value: number;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function endOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
}

/** Monday as first day of week */
function startOfWeekMon(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  const diffToMon = (day + 6) % 7; // Mon=0 ... Sun=6
  x.setDate(x.getDate() - diffToMon);
  return x;
}

function endOfWeekMon(d: Date): Date {
  const s = startOfWeekMon(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

export function rangeFor(anchor: Date, g: Granularity): Range {
  if (g === "day") {
    // "日"视图：以 anchor 为中心，展示过去 7 天 + 未来 7 天（含当天，共 15 天）
    const center = startOfDay(anchor);
    const start = new Date(center);
    start.setDate(start.getDate() - 7);
    const end = new Date(center);
    end.setDate(end.getDate() + 7);
    return { startMs: start.getTime(), endMs: endOfDay(end).getTime() };
  }
  if (g === "week") {
    return { startMs: startOfWeekMon(anchor).getTime(), endMs: endOfWeekMon(anchor).getTime() };
  }
  if (g === "month") {
    return { startMs: startOfMonth(anchor).getTime(), endMs: endOfMonth(anchor).getTime() };
  }
  return { startMs: startOfYear(anchor).getTime(), endMs: endOfYear(anchor).getTime() };
}

export async function getSummary(range: Range): Promise<LedgerSummary> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    expense: number | null;
    income: number | null;
  }>(
    `SELECT
       SUM(CASE WHEN kind='expense' THEN amount_cents ELSE 0 END) AS expense,
       SUM(CASE WHEN kind='income' THEN amount_cents ELSE 0 END) AS income
     FROM transactions
     WHERE deleted_at IS NULL
       AND occurred_at >= ? AND occurred_at <= ?`,
    [range.startMs, range.endMs],
  );

  const expenseCents = row?.expense ?? 0;
  const incomeCents = row?.income ?? 0;
  return {
    expenseCents,
    incomeCents,
    netCents: incomeCents - expenseCents,
  };
}

export async function getCategoryBreakdown(
  range: Range,
  kind: TxKind,
  limit = 6,
): Promise<CategoryPoint[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ category: string; s: number }>(
    `SELECT category, SUM(amount_cents) AS s
     FROM transactions
     WHERE deleted_at IS NULL
       AND occurred_at >= ? AND occurred_at <= ?
       AND kind = ?
     GROUP BY category
     ORDER BY s DESC`,
    [range.startMs, range.endMs, kind],
  );
  // 支出：同一消费类型可能曾以英文 id / 中文 label 混存，合并后再排序取 Top N
  const merged = new Map<string, number>();
  for (const r of rows ?? []) {
    const raw = typeof r.category === "string" ? r.category : "";
    const label =
      kind === "expense"
        ? displayLabelForStoredCategory(raw)
        : raw.trim() || "未分类";
    merged.set(label, (merged.get(label) ?? 0) + (r.s ?? 0));
  }
  const list = Array.from(merged.entries()).map(([label, value]) => ({
    label,
    value,
  }));
  list.sort((a, b) => b.value - a.value);
  if (list.length <= limit) return list;

  const top = list.slice(0, limit);
  const other = list.slice(limit).reduce((acc, x) => acc + x.value, 0);
  return other > 0 ? [...top, { label: "其他", value: other }] : top;
}

export async function getTrend(
  range: Range,
  g: Granularity,
  kind: TxKind,
  anchor: Date,
): Promise<TrendPoint[]> {
  // Implementation strategy:
  // - Day: 15-day window, bucket by local calendar day
  // - Week: bucket by weekday Mon..Sun (7 buckets)
  // - Month: bucket by day-of-month 1..N
  // - Year: bucket by month 1..12
  const db = await getDb();

  if (g === "day") {
    const rows = await db.getAllAsync<{ day: string; s: number }>(
      `SELECT strftime('%Y-%m-%d', occurred_at / 1000, 'unixepoch', 'localtime') AS day,
              SUM(amount_cents) AS s
       FROM transactions
       WHERE deleted_at IS NULL
         AND occurred_at >= ? AND occurred_at <= ?
         AND kind = ?
       GROUP BY day
       ORDER BY day ASC`,
      [range.startMs, range.endMs, kind],
    );
    const map = new Map<string, number>();
    for (const r of rows ?? []) map.set(r.day, r.s ?? 0);

    const center = startOfDay(anchor);
    const start = new Date(center);
    start.setDate(start.getDate() - 7);

    const out: TrendPoint[] = [];
    for (let i = 0; i < 15; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const dd = d.getDate();
      const key = `${y}-${String(m).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
      out.push({
        label: `${m}/${dd}`,
        value: map.get(key) ?? 0,
      });
    }
    return out;
  }

  if (g === "week") {
    const rows = await db.getAllAsync<{ d: number; s: number }>(
      `SELECT CAST(strftime('%w', occurred_at / 1000, 'unixepoch', 'localtime') AS INTEGER) AS d,
              SUM(amount_cents) AS s
       FROM transactions
       WHERE deleted_at IS NULL
         AND occurred_at >= ? AND occurred_at <= ?
         AND kind = ?
       GROUP BY d
       ORDER BY d ASC`,
      [range.startMs, range.endMs, kind],
    );
    // SQLite %w: 0=Sun..6=Sat. We'll remap to Mon..Sun.
    const map = new Map<number, number>();
    for (const r of rows ?? []) map.set(r.d, r.s ?? 0);
    const labels = ["一", "二", "三", "四", "五", "六", "日"];
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.map((w, idx) => ({
      label: labels[idx],
      value: map.get(w) ?? 0,
    }));
  }

  if (g === "month") {
    const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    const rows = await db.getAllAsync<{ dd: number; s: number }>(
      `SELECT CAST(strftime('%d', occurred_at / 1000, 'unixepoch', 'localtime') AS INTEGER) AS dd,
              SUM(amount_cents) AS s
       FROM transactions
       WHERE deleted_at IS NULL
         AND occurred_at >= ? AND occurred_at <= ?
         AND kind = ?
       GROUP BY dd
       ORDER BY dd ASC`,
      [range.startMs, range.endMs, kind],
    );
    const map = new Map<number, number>();
    for (const r of rows ?? []) map.set(r.dd, r.s ?? 0);
    return Array.from({ length: daysInMonth }, (_, i) => {
      const dd = i + 1;
      return { label: `${dd}`, value: map.get(dd) ?? 0 };
    });
  }

  // year
  const rows = await db.getAllAsync<{ mm: number; s: number }>(
    `SELECT CAST(strftime('%m', occurred_at / 1000, 'unixepoch', 'localtime') AS INTEGER) AS mm,
            SUM(amount_cents) AS s
     FROM transactions
     WHERE deleted_at IS NULL
       AND occurred_at >= ? AND occurred_at <= ?
       AND kind = ?
     GROUP BY mm
     ORDER BY mm ASC`,
    [range.startMs, range.endMs, kind],
  );
  const map = new Map<number, number>();
  for (const r of rows ?? []) map.set(r.mm, r.s ?? 0);
  return Array.from({ length: 12 }, (_, i) => {
    const mm = i + 1;
    return { label: `${mm}`, value: map.get(mm) ?? 0 };
  });
}

