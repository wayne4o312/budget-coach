import { Platform, Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { ChevronDown, Plus } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";
import type { ComponentType } from "react";

import { SpendCategorySheet } from "@/components/home/SpendCategorySheet";
import { useColorScheme } from "@/components/useColorScheme";
import EmptySvg from "@/assets/svgs/empty.svg";
import { computeBudgetSnapshot } from "@/src/domain/budget";
import { formatCny } from "@/src/domain/money";
import { Text } from "@/components/ui/text";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GlassPanel } from "@/components/ui/glass-panel";
import {
  listTransactionsForDay,
  softDeleteTransaction,
  sumMonthSpentCents,
  sumTodaySpentCents,
  type LocalTransactionRow,
} from "@/src/domain/localTransactions";
import { formatCompactSignedYuan } from "@/src/domain/moneyDisplay";

// NOTE: `@expo/ui/swift-ui` is iOS-only. Importing it on web will crash at runtime.

function formatTodayDateEn(d: Date): string {
  const weekdays = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ] as const;
  const months = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ] as const;
  return `${weekdays[d.getDay()]}, ${d.getFullYear()} ${
    months[d.getMonth()]
  } ${d.getDate()}`;
}

function RingChart({
  size = 88,
  strokeWidth = 9,
  progress,
  trackColor = "rgba(122,105,89,0.22)",
  progressColor = "rgba(171,121,66,0.95)",
}: {
  size?: number;
  strokeWidth?: number;
  progress: number;
  trackColor?: string;
  progressColor?: string;
}) {
  const clamped = Math.min(1, Math.max(0, progress));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c * (1 - clamped);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      {/* glow */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={progressColor}
        strokeWidth={strokeWidth + 6}
        strokeLinecap="round"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={dashOffset}
        fill="transparent"
        rotation={-90}
        originX={size / 2}
        originY={size / 2}
        opacity={0.14}
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={progressColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={dashOffset}
        fill="transparent"
        rotation={-90}
        originX={size / 2}
        originY={size / 2}
      />
    </Svg>
  );
}

// (SceneIcon removed: no longer used on overview list)

export default function TodayScreen() {
  useColorScheme(); // keep hook (future dark), icon uses warm palette now
  const insets = useSafeAreaInsets();
  const today = new Date();

  // iOS-only SwiftUI primitives (loaded lazily to keep web working).
  type LooseProps = { [key: string]: unknown };
  type SwiftModule = {
    Host: ComponentType<LooseProps>;
    Menu: ComponentType<LooseProps>;
    Button: ComponentType<LooseProps>;
    BottomSheet: ComponentType<LooseProps>;
    Group: ComponentType<LooseProps>;
    HStack: ComponentType<LooseProps>;
    Spacer: ComponentType<LooseProps>;
    Text: ComponentType<LooseProps>;
    VStack: ComponentType<LooseProps>;
    DatePicker: ComponentType<LooseProps>;
  };
  type SwiftModifiers = {
    datePickerStyle: (style: string) => unknown;
    font: (opts: { size?: number; weight?: string }) => unknown;
    padding: (opts: {
      all?: number;
      horizontal?: number;
      vertical?: number;
    }) => unknown;
    presentationDetents: (detents: unknown[]) => unknown;
    presentationDragIndicator: (visibility: string) => unknown;
  };

  const Swift =
    Platform.OS === "ios"
      ? (require("@expo/ui/swift-ui") as unknown as SwiftModule)
      : null;
  const SwiftMods =
    Platform.OS === "ios"
      ? (require("@expo/ui/swift-ui/modifiers") as unknown as SwiftModifiers)
      : null;
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [pendingKind, setPendingKind] = useState<"expense" | "income">(
    "expense"
  );
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [rows, setRows] = useState<LocalTransactionRow[]>([]);
  const [todaySpentCents, setTodaySpentCents] = useState(0);
  const [monthSpentCents, setMonthSpentCents] = useState(0);

  const loadForDate = useCallback(async () => {
    let cancelled = false;
    void (async () => {
      const [list, todaySum, monthSum] = await Promise.all([
        listTransactionsForDay(selectedDate),
        sumTodaySpentCents(selectedDate),
        sumMonthSpentCents(selectedDate),
      ]);
      if (cancelled) return;
      setRows(list);
      setTodaySpentCents(todaySum);
      setMonthSpentCents(monthSum);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  useEffect(() => {
    void loadForDate();
  }, [loadForDate]);

  useFocusEffect(
    useCallback(() => {
      void loadForDate();
    }, [loadForDate])
  );

  const onDeleteTx = useCallback(
    async (id: string) => {
      // optimistic remove
      setRows((prev) => prev.filter((x) => x.id !== id));
      try {
        await softDeleteTransaction(id);
      } finally {
        // refresh sums + list ordering
        void loadForDate();
      }
    },
    [loadForDate]
  );

  const snapshot = computeBudgetSnapshot({
    inputs: {
      budgetMode: "manual_spend_cap",
      monthlySpendCapCents: 300000,
      monthlyIncomeCents: 0,
      monthlySavingGoalCents: 0,
      rewardRatio: 0.1,
    },
    now: today,
    monthSpentCents,
  });

  const monthProgress =
    snapshot.monthlyBudgetCents <= 0
      ? 0
      : snapshot.monthlySpentCents / snapshot.monthlyBudgetCents;

  const remainingRatio =
    snapshot.monthlyBudgetCents <= 0
      ? 0
      : snapshot.monthlyRemainingCents / snapshot.monthlyBudgetCents;

  const comfortable = remainingRatio >= 0.4;
  const hero = comfortable
    ? {
        text: "rgba(15, 18, 14, 0.92)",
        muted: "rgba(15, 18, 14, 0.56)",
        track: "rgba(15, 18, 14, 0.16)",
        ring: "rgba(15, 18, 14, 0.52)",
      }
    : {
        text: "rgba(15, 18, 14, 0.92)",
        muted: "rgba(15, 18, 14, 0.56)",
        track: "rgba(15, 18, 14, 0.16)",
        ring: "rgba(15, 18, 14, 0.52)",
      };

  const amountFont =
    Platform.OS === "ios"
      ? ({ fontFamily: "DINPro-Medium" } as const)
      : ({ fontFamily: "DINPro-Medium" } as const);

  function formatDateBar(d: Date) {
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${m}月${day}日`;
  }

  return (
    <AuroraBackground>
      <ScrollView
        className="px-5"
        contentContainerStyle={{
          paddingTop: Math.max(18, insets.top + 12),
          paddingBottom: Math.max(24, insets.bottom + 24),
        }}
      >
        <View className="gap-4">
          {/* header */}
          <View className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <Text
                className="text-[12px] tracking-[1.6px]"
                style={{ color: "rgba(15,18,14,0.52)" }}
              >
                {formatTodayDateEn(selectedDate)}
              </Text>
              {Platform.OS === "ios" && Swift ? (
                <Swift.Host style={{ width: 40, height: 40 }} matchContents>
                  <Swift.Menu
                    label={
                      <View
                        className="h-10 w-10 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.18)",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.34)",
                          shadowColor: "rgba(0,0,0,1)",
                          shadowOpacity: 0.06,
                          shadowRadius: 14,
                          shadowOffset: { width: 0, height: 8 },
                        }}
                      >
                        <Plus
                          size={22}
                          color="rgba(18,22,16,0.92)"
                          strokeWidth={2.2}
                        />
                      </View>
                    }
                  >
                    <Swift.Button
                      onPress={() => {
                        setPendingKind("expense");
                        setCategorySheetOpen(true);
                      }}
                      label="支出"
                      systemImage="minus.circle"
                    ></Swift.Button>
                    <Swift.Button
                      onPress={() => {
                        setPendingKind("income");
                        setCategorySheetOpen(true);
                      }}
                      label="收入"
                      systemImage="plus.circle"
                    ></Swift.Button>
                  </Swift.Menu>
                </Swift.Host>
              ) : (
                <Pressable
                  accessibilityLabel="新增记录"
                  onPress={() => {
                    setPendingKind("expense");
                    setCategorySheetOpen(true);
                  }}
                  className="h-10 w-10 items-center justify-center rounded-full active:opacity-90"
                  hitSlop={10}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.18)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.34)",
                    shadowColor: "rgba(0,0,0,1)",
                    shadowOpacity: 0.06,
                    shadowRadius: 14,
                    shadowOffset: { width: 0, height: 8 },
                  }}
                >
                  <Plus
                    size={22}
                    color="rgba(18,22,16,0.92)"
                    strokeWidth={2.2}
                  />
                </Pressable>
              )}
            </View>

            {/* date bar */}
            <Pressable
              onPress={() => setDateSheetOpen(true)}
              className="self-start flex-row items-center justify-start gap-1.5 py-1 active:opacity-85"
              accessibilityLabel="选择日期"
            >
              <Text
                className="text-[13px] font-sansMedium"
                style={{ color: "rgba(18,22,16,0.78)" }}
              >
                {formatDateBar(selectedDate)}
              </Text>
              <ChevronDown size={14} color="rgba(18,22,16,0.42)" />
            </Pressable>
          </View>

          {/* hero (glass, no card borders) */}
          <GlassPanel className="px-5 pt-4 pb-5">
            <View className="flex-row items-center justify-between gap-4">
              <View className="flex-1 gap-1">
                <Text
                  style={{ color: hero.muted }}
                  className="text-[12px] tracking-[1.4px] font-sansMedium"
                >
                  今日支出
                </Text>
                <View className="flex-row items-baseline">
                  <Text
                    className="text-[18px] leading-[26px]"
                    style={{
                      color: hero.text,
                      marginRight: 2,
                      ...amountFont,
                      opacity: 0.86,
                    }}
                  >
                    ¥
                  </Text>
                  <Text
                    className="text-left text-[34px] leading-[38px] tracking-[-0.8px]"
                    style={{ color: hero.text, ...amountFont }}
                  >
                    {formatCny(todaySpentCents)}
                  </Text>
                </View>

                <View className="h-3" />

                <Text
                  style={{ color: hero.muted }}
                  className="text-[12px] tracking-[1.4px] font-sansMedium"
                >
                  本月剩余预算
                </Text>
                <View className="flex-row items-baseline">
                  <Text
                    className="text-[14px] leading-[20px]"
                    style={{
                      color: hero.text,
                      marginRight: 2,
                      ...amountFont,
                      opacity: 0.84,
                    }}
                  >
                    ¥
                  </Text>
                  <Text
                    className="text-left text-[20px] leading-[24px] tracking-[-0.2px]"
                    style={{ color: hero.text, ...amountFont }}
                  >
                    {formatCny(snapshot.monthlyRemainingCents)}
                  </Text>
                </View>
              </View>

              <View className="items-center justify-center">
                <RingChart
                  progress={monthProgress}
                  size={88}
                  strokeWidth={8}
                  trackColor={hero.track}
                  progressColor={hero.ring}
                />
                <Text
                  className="mt-2 text-[11px] tracking-[1.6px]"
                  style={{ color: hero.muted }}
                >
                  {Math.round(monthProgress * 100)}% 已使用
                </Text>
              </View>
            </View>
          </GlassPanel>

          {/* list */}
          <View className="gap-2">
            {rows.length === 0 ? (
              <View className="px-2 py-10">
                <View className="items-center">
                  <View style={{ opacity: 0.6 }}>
                    <EmptySvg width={170} height={170} />
                  </View>
                  <Text
                    className="mt-5 text-center text-[12px] leading-[16px] tracking-[0.4px]"
                    style={{ color: "rgba(15,18,14,0.46)" }}
                  >
                    还没有记账记录
                  </Text>
                  <Text
                    className="mt-2 text-center text-[12px] leading-[16px]"
                    style={{ color: "rgba(15,18,14,0.40)" }}
                  >
                    点击右上角 + 记一笔
                  </Text>
                </View>
              </View>
            ) : (
              <View>
                {rows.map((tx, idx) => (
                  <Swipeable
                    key={tx.id}
                    overshootRight={false}
                    renderRightActions={() => (
                      <View
                        style={{
                          width: 84,
                          height: "100%",
                          backgroundColor: "#EF4444",
                        }}
                      >
                        <Pressable
                          accessibilityLabel="删除记录"
                          onPress={() => void onDeleteTx(tx.id)}
                          className="flex-1 items-center justify-center active:opacity-90"
                        >
                          <Text className="text-[15px] font-sansMedium text-white">
                            删除
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  >
                    <View
                      style={{
                        // SwiftUI List-like: no outer card, rely on subtle tinted row background
                        backgroundColor: "rgba(236, 243, 232, 0.58)",
                      }}
                      className="flex-row items-baseline justify-between px-4 py-3.5"
                    >
                      <View
                        pointerEvents="none"
                        style={{
                          position: "absolute",
                          left: 16,
                          right: 16,
                          bottom: 0,
                          height: idx < rows.length - 1 ? 1 : 0,
                          backgroundColor: "rgba(15, 18, 14, 0.08)",
                        }}
                      />
                      <Text
                        className="pr-3 text-[16px] font-sansMedium"
                        style={{ color: "rgba(18,22,16,0.84)" }}
                      >
                        {tx.category}
                      </Text>
                      <Text
                        className={`shrink-0 text-[17px] tracking-tight ${
                          tx.kind === "expense"
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                        style={amountFont}
                      >
                        {formatCompactSignedYuan(tx.amount_cents, tx.kind)}
                      </Text>
                    </View>
                  </Swipeable>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <SpendCategorySheet
        open={categorySheetOpen}
        kind={pendingKind}
        onClose={() => setCategorySheetOpen(false)}
        onSelect={(label) => {
          setCategorySheetOpen(false);
          router.push({
            pathname: "/quick-entry",
            params: { category: label, kind: pendingKind },
          });
        }}
      />

      {Platform.OS === "ios" && Swift && SwiftMods ? (
        <View
          // 仅在 sheet 打开时接管触摸；关闭时不遮挡首页点击（+ / 日期栏）
          pointerEvents={dateSheetOpen ? "auto" : "none"}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <Swift.Host
            // BottomSheet/DatePicker 属于 SwiftUI 视图：必须在 Host 内渲染，否则会触发 SwiftUIVirtualViewObjC 挂载崩溃
            style={{ flex: 1 }}
            ignoreSafeArea="all"
          >
            <Swift.BottomSheet
              isPresented={dateSheetOpen}
              onIsPresentedChange={setDateSheetOpen}
              fitToContents
            >
              <Swift.Group
                modifiers={[
                  SwiftMods.presentationDetents([{ height: 340 }]),
                  SwiftMods.presentationDragIndicator("visible"),
                ]}
              >
                <Swift.VStack
                  modifiers={[SwiftMods.padding({ all: 14 })]}
                  spacing={10}
                >
                  <Swift.HStack>
                    <Swift.Spacer />
                    <Swift.Button
                      onPress={() => setDateSheetOpen(false)}
                      modifiers={[
                        SwiftMods.padding({ horizontal: 10, vertical: 6 }),
                      ]}
                    >
                      <Swift.Text
                        modifiers={[
                          SwiftMods.font({ size: 15, weight: "medium" }),
                        ]}
                      >
                        完成
                      </Swift.Text>
                    </Swift.Button>
                  </Swift.HStack>
                  <Swift.DatePicker
                    selection={selectedDate}
                    displayedComponents={["date"]}
                    onDateChange={(d: Date) => setSelectedDate(d)}
                    modifiers={[SwiftMods.datePickerStyle("wheel")]}
                  />
                </Swift.VStack>
              </Swift.Group>
            </Swift.BottomSheet>
          </Swift.Host>
        </View>
      ) : null}
    </AuroraBackground>
  );
}

// (kept empty intentionally)
