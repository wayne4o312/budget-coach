import type { ComponentType } from "react";
import {
  BookOpen,
  Clapperboard,
  Ellipsis,
  HeartPulse,
  Home,
  Shirt,
  ShoppingBag,
  Smartphone,
  TrainFront,
  Utensils,
} from "lucide-react-native";

type IconProps = { size?: number; color?: string; strokeWidth?: number };

export type SpendCategoryDef = {
  id: string;
  label: string;
  Icon: ComponentType<IconProps>;
};

/** 首页「记一笔」抽屉中的消费类型（图标 + 文案） */
export const SPEND_CATEGORIES: SpendCategoryDef[] = [
  { id: "study", label: "学习", Icon: BookOpen },
  { id: "transit", label: "交通", Icon: TrainFront },
  { id: "comms", label: "通讯", Icon: Smartphone },
  { id: "medical", label: "医疗", Icon: HeartPulse },
  { id: "dining", label: "餐饮", Icon: Utensils },
  { id: "shopping", label: "购物", Icon: ShoppingBag },
  { id: "fun", label: "娱乐", Icon: Clapperboard },
  { id: "housing", label: "居住", Icon: Home },
  { id: "clothes", label: "服饰", Icon: Shirt },
  { id: "other", label: "其他", Icon: Ellipsis },
];

const CATEGORY_ID_TO_LABEL = new Map(
  SPEND_CATEGORIES.map((c) => [c.id, c.label]),
);
const CATEGORY_LABEL_SET = new Set(SPEND_CATEGORIES.map((c) => c.label));

/** 将本地流水里存的 category（中文名或英文 id）统一成展示用中文类目 */
export function displayLabelForStoredCategory(raw: string): string {
  const t = raw.trim();
  if (!t) return "未分类";
  if (CATEGORY_LABEL_SET.has(t)) return t;
  const fromId = CATEGORY_ID_TO_LABEL.get(t);
  if (fromId) return fromId;
  return t;
}

/**
 * 与 SPEND_CATEGORIES 顺序一一对应。
 * 低饱和：各色相向中性灰靠拢，仅保留轻微色相差异，适合浅色界面。
 */
export const EXPENSE_CATEGORY_PIE_COLORS: string[] = [
  "rgba(152, 162, 156, 0.94)", // 学习 · 灰绿
  "rgba(148, 156, 172, 0.94)", // 交通 · 灰蓝
  "rgba(162, 156, 172, 0.94)", // 通讯 · 灰紫
  "rgba(146, 168, 168, 0.94)", // 医疗 · 灰青
  "rgba(182, 164, 156, 0.94)", // 餐饮 · 灰褐
  "rgba(176, 170, 152, 0.94)", // 购物 · 卡其
  "rgba(170, 162, 174, 0.94)", // 娱乐 · 藕灰紫
  "rgba(156, 166, 154, 0.94)", // 居住 · 灰绿
  "rgba(180, 164, 164, 0.94)", // 服饰 · 灰玫
  "rgba(154, 158, 166, 0.94)", // 其他 · 冷灰
];

/** 收入分类无固定类目表时轮询用 */
export const INCOME_PIE_COLORS: string[] = [
  "rgba(148, 156, 172, 0.94)",
  "rgba(152, 162, 156, 0.94)",
  "rgba(182, 164, 156, 0.94)",
  "rgba(162, 156, 172, 0.94)",
  "rgba(146, 168, 168, 0.94)",
  "rgba(176, 170, 152, 0.94)",
  "rgba(170, 162, 174, 0.94)",
  "rgba(154, 158, 166, 0.94)",
];

/** 饼图扇区内百分比（Skia Text） */
export const PIE_CHART_LABEL_COLOR = "rgba(28, 32, 38, 0.90)";

export function pieColorForExpenseCategoryLabel(label: string): string {
  const idx = SPEND_CATEGORIES.findIndex((c) => c.label === label);
  if (idx >= 0) return EXPENSE_CATEGORY_PIE_COLORS[idx % EXPENSE_CATEGORY_PIE_COLORS.length];
  if (label === "其他") return "rgba(138, 142, 150, 0.94)";
  if (label === "未分类") return "rgba(158, 162, 168, 0.94)";
  // 未知字符串：稳定着色，避免与已知类目冲突感
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h + label.charCodeAt(i) * (i + 1)) % 7;
  return EXPENSE_CATEGORY_PIE_COLORS[(SPEND_CATEGORIES.length + h) % EXPENSE_CATEGORY_PIE_COLORS.length];
}
