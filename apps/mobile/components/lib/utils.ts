/**
 * 已移除 Tailwind / tailwind-merge。需要合并 RN 样式时用数组：`style={[a, b]}`，
 * 或使用 `StyleSheet.flatten` / `@/src/theme/rn` 的 mergeView / mergeText。
 */
export function noopCn(): string {
  return "";
}
