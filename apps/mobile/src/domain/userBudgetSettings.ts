import type { BudgetInputs, BudgetMode } from "@/src/domain/budget";
import { getDb } from "@/src/db/db";

const LOCAL_ID = "local";

const DEFAULTS: BudgetInputs = {
  budgetMode: "manual_spend_cap",
  /** 0 表示尚未在设置页保存过有效上限（首页展示入口，不用虚假默认金额） */
  monthlySpendCapCents: 0,
  monthlyIncomeCents: 0,
  monthlySavingGoalCents: 0,
  rewardRatio: 0.1,
};

/** 首屏占位；持久化加载后会覆盖 */
export const defaultBudgetInputs: BudgetInputs = { ...DEFAULTS };

export async function loadBudgetInputs(): Promise<BudgetInputs> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    budget_mode: string;
    monthly_spend_cap_cents: number;
    monthly_income_cents: number;
    monthly_saving_goal_cents: number;
    reward_ratio: number;
  }>(
    `SELECT budget_mode, monthly_spend_cap_cents, monthly_income_cents,
            monthly_saving_goal_cents, reward_ratio
     FROM user_settings WHERE id = ?`,
    [LOCAL_ID],
  );
  if (!row) return { ...DEFAULTS };

  return {
    budgetMode: (row.budget_mode as BudgetMode) ?? DEFAULTS.budgetMode,
    monthlySpendCapCents: Math.max(0, Math.trunc(row.monthly_spend_cap_cents)),
    monthlyIncomeCents: Math.max(0, row.monthly_income_cents ?? 0),
    monthlySavingGoalCents: Math.max(0, row.monthly_saving_goal_cents ?? 0),
    rewardRatio:
      Number.isFinite(row.reward_ratio) && row.reward_ratio >= 0
        ? row.reward_ratio
        : DEFAULTS.rewardRatio,
  };
}

export async function saveBudgetInputs(inputs: BudgetInputs): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  const cap = Math.max(0, Math.trunc(inputs.monthlySpendCapCents));
  const income = Math.max(0, Math.trunc(inputs.monthlyIncomeCents));
  const goal = Math.max(0, Math.trunc(inputs.monthlySavingGoalCents));
  const rr = Math.min(1, Math.max(0, inputs.rewardRatio));

  await db.runAsync(
    `INSERT INTO user_settings (
       id, user_id, monthly_saving_goal_cents, budget_mode,
       monthly_spend_cap_cents, monthly_income_cents, reward_ratio,
       reminder_rules_json, updated_at
     ) VALUES (?, NULL, ?, ?, ?, ?, ?, '[]', ?)
     ON CONFLICT(id) DO UPDATE SET
       monthly_saving_goal_cents = excluded.monthly_saving_goal_cents,
       budget_mode = excluded.budget_mode,
       monthly_spend_cap_cents = excluded.monthly_spend_cap_cents,
       monthly_income_cents = excluded.monthly_income_cents,
       reward_ratio = excluded.reward_ratio,
       updated_at = excluded.updated_at`,
    [LOCAL_ID, goal, inputs.budgetMode, cap, income, rr, now],
  );
}
