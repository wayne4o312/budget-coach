export function yuanToCents(amountYuan: number): number {
  return Math.round(amountYuan * 100);
}

export function centsToYuan(amountCents: number): number {
  return amountCents / 100;
}

export function formatCny(amountCents: number): string {
  const yuan = centsToYuan(amountCents);
  return yuan.toFixed(2);
}

export function formatCnyWithSymbol(amountCents: number): string {
  return `¥${formatCny(amountCents)}`;
}

