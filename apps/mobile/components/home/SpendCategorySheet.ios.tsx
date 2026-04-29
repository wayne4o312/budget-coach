import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as React from "react";
import { SymbolView } from "expo-symbols";
import {
  Modal,
  Pressable,
  ScrollView,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SFSymbol } from "sf-symbols-typescript";

import { Text } from "@/components/ui/text";

type Props = {
  open: boolean;
  onClose: () => void;
  kind?: "expense" | "income";
  onSelect: (categoryLabel: string) => void;
};

// 参考你发的分类布局，但文案做了轻微差异化（避免完全雷同）
const EXPENSE_CATEGORIES: Array<{
  id: string;
  label: string;
  systemImage: SFSymbol;
}> = [
  { id: "food", label: "餐饮", systemImage: "fork.knife" },
  { id: "shop", label: "购物", systemImage: "bag" },
  { id: "daily", label: "日用", systemImage: "shippingbox" },
  { id: "transit", label: "出行", systemImage: "bus" },

  { id: "grocery", label: "果蔬", systemImage: "leaf" },
  { id: "snack", label: "零食", systemImage: "cup.and.saucer" },
  { id: "dessert", label: "甜品", systemImage: "birthday.cake" },
  { id: "sport", label: "健身", systemImage: "figure.run" },

  { id: "fun", label: "娱乐", systemImage: "gamecontroller" },
  { id: "comms", label: "通讯", systemImage: "wifi" },
  { id: "clothes", label: "服饰", systemImage: "tshirt" },
  { id: "beauty", label: "美妆", systemImage: "sparkles" },

  { id: "rent", label: "住房", systemImage: "house" },
  { id: "home", label: "家用", systemImage: "sofa" },
  { id: "kids", label: "孩子", systemImage: "figure.and.child.holdinghands" },
  { id: "elder", label: "长辈", systemImage: "person.2" },

  { id: "social", label: "社交", systemImage: "person.3" },
  { id: "travel", label: "旅行", systemImage: "airplane" },
  { id: "smoke", label: "烟酒", systemImage: "wineglass" },
  { id: "digital", label: "数码", systemImage: "headphones" },

  { id: "car", label: "汽车", systemImage: "car" },
  { id: "medical", label: "医疗", systemImage: "cross.case" },
  { id: "books", label: "书籍", systemImage: "book" },
  { id: "study", label: "学习", systemImage: "graduationcap" },

  { id: "pet", label: "宠物", systemImage: "pawprint" },
  { id: "cashgift", label: "礼金", systemImage: "yensign.circle" },
  { id: "gift", label: "礼物", systemImage: "gift" },
  { id: "work", label: "办公", systemImage: "briefcase" },

  { id: "repair", label: "维修", systemImage: "wrench.and.screwdriver" },
  { id: "donate", label: "捐赠", systemImage: "heart" },
  { id: "express", label: "快递", systemImage: "truck.box" },
  { id: "other", label: "其他", systemImage: "ellipsis" },
];

const INCOME_CATEGORIES: Array<{
  id: string;
  label: string;
  systemImage: SFSymbol;
}> = [
  { id: "salary", label: "工资", systemImage: "banknote" },
  { id: "bonus", label: "奖金", systemImage: "sparkles" },
  { id: "reimburse", label: "报销", systemImage: "doc.text" },
  { id: "invest", label: "理财", systemImage: "chart.line.uptrend.xyaxis" },
  { id: "hongbao", label: "红包", systemImage: "gift" },
  { id: "other_income", label: "其他", systemImage: "ellipsis" },
];

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** 底部淡雾高度（不含 safe area），提示可继续上滑 */
const BOTTOM_SCROLL_HINT_PX = 120;
const BOTTOM_END_SPACER_PX = 10;

export function SpendCategorySheet({ open, onClose, kind, onSelect }: Props) {
  const scheme = useColorScheme();
  const tint = scheme === "dark" ? "dark" : "light";
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const [scrollHintVisible, setScrollHintVisible] = React.useState(true);

  const sidePadding = 12;
  const panelPadding = 16;
  const gridGap = 20;
  const columns = winW < 390 ? 3 : 4;
  const panelW = Math.max(280, winW - sidePadding * 2);
  const usableW = panelW - panelPadding * 2;
  const cellW = Math.floor((usableW - gridGap * (columns - 1)) / columns);
  const cellH = Math.floor(cellW * 0.9);
  const circleSize = Math.floor(Math.min(cellW, cellH) * 0.96);
  const categories =
    (kind ?? "expense") === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1">
        <BlurView
          intensity={tint === "dark" ? 40 : 85}
          tint={tint}
          className="absolute inset-0"
        />
        <View className="absolute inset-0 bg-white/10" />

        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityLabel="关闭菜单"
        />

        <View className="flex-1" pointerEvents="box-none">
          {/* 顶栏与分割线全屏宽（不受下方列表 margin 影响） */}
          <View
            className="w-full border-b border-border/60"
            style={{ paddingTop: insets.top }}
          >
            <View
              className="relative min-h-[48px] flex-row items-center justify-end "
              style={{ paddingHorizontal: sidePadding + 10 }}
            >
              {/* 标题：items-center 居中 */}
              <View className="absolute inset-0 items-center justify-center">
                <Text className="text-[17px] font-sansMedium leading-[20px] text-foreground">
                  {(kind ?? "expense") === "income" ? "收入" : "支出"}
                </Text>
              </View>

              {/* 右侧取消 */}
              <View className="items-end justify-center">
                <Pressable
                  onPress={onClose}
                  accessibilityLabel="取消"
                  hitSlop={12}
                  className="py-1 active:opacity-60"
                >
                  <Text className="text-[16px] font-sansMedium leading-[20px] text-foreground/90">
                    取消
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View className="flex-1 bg-transparent">
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: BOTTOM_END_SPACER_PX + insets.bottom,
                alignItems: "center",
              }}
              onScroll={(e) => {
                const { contentOffset, layoutMeasurement, contentSize } =
                  e.nativeEvent;
                const threshold = 16;
                const atBottom =
                  contentOffset.y + layoutMeasurement.height >=
                  contentSize.height - threshold;
                setScrollHintVisible(!atBottom);
              }}
              scrollEventThrottle={16}
            >
              <View
                style={{
                  width: panelW,
                  paddingHorizontal: panelPadding,
                  paddingVertical: 18,
                  rowGap: gridGap,
                }}
              >
                {chunk(categories, columns).map((row) => {
                  const missing = columns - row.length;
                  return (
                    <View
                      key={`r-${row.map((x) => x.id).join("-")}`}
                      style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        columnGap: gridGap,
                      }}
                    >
                      {row.map((c) => (
                        <View
                          key={c.id}
                          style={{
                            width: circleSize,
                            alignItems: "center",
                          }}
                        >
                          <Pressable
                            onPress={() => onSelect(c.label)}
                            accessibilityLabel={c.label}
                            className="active:opacity-80"
                            style={{
                              width: circleSize,
                              height: circleSize,
                              borderRadius: circleSize / 2,
                              alignItems: "center",
                              justifyContent: "center",
                              // Use mostly-opaque fills so circles don't pick up the blurred background tint.
                              backgroundColor:
                                scheme === "dark"
                                  ? "rgba(44,44,46,0.92)"
                                  : "rgba(255,255,255,0.88)",
                              borderWidth: 1,
                              borderColor:
                                scheme === "dark"
                                  ? "rgba(255,255,255,0.10)"
                                  : "rgba(0,0,0,0.06)",
                              shadowColor: "#000",
                              shadowOpacity: scheme === "dark" ? 0.2 : 0.1,
                              shadowRadius: scheme === "dark" ? 8 : 6,
                              shadowOffset: { width: 0, height: 4 },
                              elevation: 3,
                            }}
                          >
                            {/* subtle top highlight */}
                            <View
                              pointerEvents="none"
                              style={{
                                position: "absolute",
                                top: 1,
                                left: 1,
                                right: 1,
                                height: Math.max(
                                  10,
                                  Math.floor(circleSize * 0.33)
                                ),
                                borderTopLeftRadius: circleSize / 2,
                                borderTopRightRadius: circleSize / 2,
                                backgroundColor:
                                  scheme === "dark"
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(255,255,255,0.50)",
                              }}
                            />
                            <View
                              pointerEvents="none"
                              style={{
                                width: 24,
                                height: 24,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <SymbolView
                                name={c.systemImage}
                                size={24}
                                type="monochrome"
                                weight="medium"
                                scale="medium"
                                tintColor="rgba(28,24,20,0.92)"
                              />
                            </View>
                          </Pressable>
                          <Text className="mt-2 text-[12px] font-sansMedium text-foreground/90">
                            {c.label}
                          </Text>
                        </View>
                      ))}
                      {missing >= 1 ? (
                        <View
                          key={`m-${row.map((x) => x.id).join("-")}-a`}
                          style={{ width: circleSize }}
                        />
                      ) : null}
                      {missing >= 2 ? (
                        <View
                          key={`m-${row.map((x) => x.id).join("-")}-b`}
                          style={{ width: circleSize }}
                        />
                      ) : null}
                      {missing >= 3 ? (
                        <View
                          key={`m-${row.map((x) => x.id).join("-")}-c`}
                          style={{ width: circleSize }}
                        />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
            <LinearGradient
              pointerEvents="none"
              colors={
                scheme === "dark"
                  ? [
                      "rgba(255,255,255,0)",
                      "rgba(245,245,248,0.55)",
                      "rgba(235,235,240,0.9)",
                    ]
                  : [
                      "rgba(255,255,255,0)",
                      "rgba(245,245,248,0.55)",
                      "rgba(235,235,240,0.9)",
                    ]
              }
              locations={[0, 0.42, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: BOTTOM_SCROLL_HINT_PX + insets.bottom,
                opacity: scrollHintVisible ? 1 : 0,
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
