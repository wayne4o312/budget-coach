export type BudgetMode = 'manual_spend_cap' | 'income_minus_goal';

export type BudgetInputs = {
  budgetMode: BudgetMode;
  monthlySpendCapCents: number; // manual
  monthlyIncomeCents: number; // income_minus_goal
  monthlySavingGoalCents: number; // income_minus_goal
  rewardRatio: number; // 0..1
};

export type BudgetSnapshot = {
  monthlyBudgetCents: number;
  monthlySpentCents: number;
  monthlyRemainingCents: number;
  daysRemaining: number;
  todaySuggestedCapCents: number;
  rewardBudgetCents: number;
};

function clampInt(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.trunc(n);
}

export function computeMonthlyBudgetCents(inputs: BudgetInputs): number {
  if (inputs.budgetMode === 'manual_spend_cap') return clampInt(inputs.monthlySpendCapCents);
  return clampInt(inputs.monthlyIncomeCents - inputs.monthlySavingGoalCents);
}

export function computeBudgetSnapshot(args: {
  inputs: BudgetInputs;
  now: Date;
  monthSpentCents: number;
}): BudgetSnapshot {
  const monthlyBudgetCents = Math.max(0, computeMonthlyBudgetCents(args.inputs));
  const monthlySpentCents = Math.max(0, clampInt(args.monthSpentCents));
  const monthlyRemainingCents = Math.max(0, monthlyBudgetCents - monthlySpentCents);

  const year = args.now.getFullYear();
  const month = args.now.getMonth(); // 0-based
  const today = args.now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - today + 1); // include today

  const todaySuggestedCapCents = Math.floor(monthlyRemainingCents / daysRemaining);

  const rewardRatio = Number.isFinite(args.inputs.rewardRatio) ? args.inputs.rewardRatio : 0.1;
  const rewardBudgetCents = Math.floor(monthlyBudgetCents * Math.min(Math.max(rewardRatio, 0), 1));

  return {
    monthlyBudgetCents,
    monthlySpentCents,
    monthlyRemainingCents,
    daysRemaining,
    todaySuggestedCapCents,
    rewardBudgetCents,
  };
}

