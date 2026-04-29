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
