/**
 * 预算页「参考说明」固定文案（非投资建议）。
 * 与「每月支出上限」等实际计算无耦合；需要按收入/推送做分析时再接数据，避免空输入框。
 */

const SAVINGS_PERCENT_OF_INCOME = 20;
const SPEND_PERCENT_OF_INCOME = 100 - SAVINGS_PERCENT_OF_INCOME;

const DATA_SOURCE_PHRASE =
  "据公开发布的消费者储蓄行为与家庭收支调研资料汇总分析";

export type BudgetAdvice = {
  summaryZh: string;
  /** 保留字段，便于以后加第二段；当前为空 */
  detailZh: string;
};

const footnote =
  "固定支出因人而异，上述比例仅供参考，不构成投资建议；以在此保存的「每月支出上限」为准。";

export function computeBudgetAdvice(): BudgetAdvice {
  return {
    summaryZh: `${DATA_SOURCE_PHRASE}，常见建议是：约 ${SAVINGS_PERCENT_OF_INCOME}% 的收入宜优先用于储蓄与还贷，约 ${SPEND_PERCENT_OF_INCOME}% 更适合规划日常消费。${footnote}`,
    detailZh: "",
  };
}
