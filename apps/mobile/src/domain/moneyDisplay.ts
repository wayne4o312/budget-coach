function formatCompactAbsYuan(absCents: number): string {
  const abs = Math.abs(absCents);
  const intPart = Math.floor(abs / 100);
  const frac = abs % 100;
  if (frac === 0) return String(intPart);
  if (frac % 10 === 0) return `${intPart}.${frac / 10}`;
  return `${intPart}.${String(frac).padStart(2, "0")}`;
}

/** 列表金额：amountCents 永远为正分；符号由 kind 决定 */
export function formatCompactSignedYuan(
  amountCents: number,
  kind: "expense" | "income",
): string {
  if (amountCents === 0) return "0";
  const body = formatCompactAbsYuan(amountCents);
  return kind === "income" ? `+${body}` : `-${body}`;
}

/** Back-compat：旧语义支出为负分，展示为「-20」或「-12.5」 */
export function formatCompactSignedExpenseYuan(amountCents: number): string {
  if (amountCents === 0) return "0";
  const neg = amountCents < 0;
  const body = formatCompactAbsYuan(amountCents);
  return neg ? `-${body}` : body;
}
