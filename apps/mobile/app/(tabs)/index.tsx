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
import { computeBudgetSnapshot, type BudgetInputs } from "@/src/domain/budget";
import {
  defaultBudgetInputs,
  loadBudgetInputs,
} from "@/src/domain/userBudgetSettings";
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
import { useDb } from "@/src/db/DbProvider";
import { todayStyles } from "@/src/screenStyles/todayTab.styles";

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
  const [budgetInputs, setBudgetInputs] = useState<BudgetInputs>(
    defaultBudgetInputs,
  );
  const { ready: dbReady } = useDb();

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

  useEffect(() => {
    if (!dbReady) return;
    void loadBudgetInputs().then(setBudgetInputs);
  }, [dbReady]);

  useFocusEffect(
    useCallback(() => {
      void loadForDate();
      if (dbReady) {
        void loadBudgetInputs().then(setBudgetInputs);
      }
    }, [loadForDate, dbReady])
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
    inputs: budgetInputs,
    now: selectedDate,
    monthSpentCents,
  });

  const budgetConfigured = budgetInputs.monthlySpendCapCents > 0;

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
        style={todayStyles.scrollPad}
        contentContainerStyle={{
          paddingTop: Math.max(18, insets.top + 12),
          paddingBottom: Math.max(24, insets.bottom + 24),
        }}
      >
        <View style={todayStyles.stackGap16}>
          {/* header */}
          <View style={todayStyles.stackGap6}>
            <View style={todayStyles.headerRow}>
              <Text
                style={[
                  todayStyles.dateEyebrow,
                  { color: "rgba(15,18,14,0.52)" },
                ]}
              >
                {formatTodayDateEn(selectedDate)}
              </Text>
              {Platform.OS === "ios" && Swift ? (
                <Swift.Host style={{ width: 40, height: 40 }} matchContents>
                  <Swift.Menu
                    label={
                      <View
                        style={[
                          todayStyles.fabCircle,
                          {
                            backgroundColor: "rgba(255,255,255,0.18)",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.34)",
                            shadowColor: "rgba(0,0,0,1)",
                            shadowOpacity: 0.06,
                            shadowRadius: 14,
                            shadowOffset: { width: 0, height: 8 },
                          },
                        ]}
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
                  hitSlop={10}
                  style={[
                    todayStyles.fabCircle,
                    {
                      backgroundColor: "rgba(255,255,255,0.18)",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.34)",
                      shadowColor: "rgba(0,0,0,1)",
                      shadowOpacity: 0.06,
                      shadowRadius: 14,
                      shadowOffset: { width: 0, height: 8 },
                    },
                  ]}
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
              style={todayStyles.dateBarPress}
              accessibilityLabel="选择日期"
            >
              <Text style={todayStyles.dateBarText}>
                {formatDateBar(selectedDate)}
              </Text>
              <ChevronDown size={14} color="rgba(18,22,16,0.42)" />
            </Pressable>
          </View>

          {/* hero (glass, no card borders) */}
          <GlassPanel style={todayStyles.heroGlass}>
            <View style={todayStyles.heroRow}>
              <View style={todayStyles.heroLeft}>
                <Text
                  style={[todayStyles.heroEyebrow, { color: hero.muted }]}
                >
                  今日支出
                </Text>
                <View style={todayStyles.heroBaseline}>
                  <Text
                    style={[
                      todayStyles.heroYuan,
                      {
                        color: hero.text,
                        marginRight: 2,
                        ...amountFont,
                        opacity: 0.86,
                      },
                    ]}
                  >
                    ¥
                  </Text>
                  <Text
                    style={[
                      todayStyles.heroBigAmt,
                      { color: hero.text, ...amountFont },
                    ]}
                  >
                    {formatCny(todaySpentCents)}
                  </Text>
                </View>

                <View style={todayStyles.spacer12} />

                <Text
                  style={[todayStyles.heroEyebrow, { color: hero.muted }]}
                >
                  本月剩余预算
                </Text>
                {budgetConfigured ? (
                  <View style={todayStyles.heroBaseline}>
                    <Text
                      style={[
                        {
                          fontSize: 14,
                          lineHeight: 20,
                          color: hero.text,
                          marginRight: 2,
                          ...amountFont,
                          opacity: 0.84,
                        },
                      ]}
                    >
                      ¥
                    </Text>
                    <Text
                      style={[
                        todayStyles.heroSmallAmt,
                        { color: hero.text, ...amountFont },
                      ]}
                    >
                      {formatCny(snapshot.monthlyRemainingCents)}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel="设置月度预算"
                    hitSlop={8}
                    onPress={() => router.push("/budget-settings")}
                    style={{ alignSelf: "flex-start", marginTop: 2 }}
                  >
                    <Text style={todayStyles.budgetSetupLink}>设置</Text>
                  </Pressable>
                )}
              </View>

              <View style={todayStyles.ringCol}>
                <RingChart
                  progress={monthProgress}
                  size={88}
                  strokeWidth={8}
                  trackColor={hero.track}
                  progressColor={hero.ring}
                />
                <Text style={[todayStyles.ringCaption, { color: hero.muted }]}>
                  {budgetConfigured
                    ? `${Math.round(monthProgress * 100)}% 已使用`
                    : "未设置"}
                </Text>
              </View>
            </View>
          </GlassPanel>

          {/* list */}
          <View style={todayStyles.listGap}>
            {rows.length === 0 ? (
              <View style={todayStyles.emptyPad}>
                <View style={todayStyles.emptyCenter}>
                  <View style={{ opacity: 0.6 }}>
                    <EmptySvg width={170} height={170} />
                  </View>
                  <Text style={todayStyles.emptyTitle}>还没有记账记录</Text>
                  <Text style={todayStyles.emptySub}>
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
                          style={todayStyles.swipeDelHit}
                        >
                          <Text style={todayStyles.swipeDelText}>删除</Text>
                        </Pressable>
                      </View>
                    )}
                  >
                    <View
                      style={[
                        todayStyles.txRow,
                        { backgroundColor: "rgba(236, 243, 232, 0.58)" },
                      ]}
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
                      <Text style={todayStyles.txCat}>{tx.category}</Text>
                      <Text
                        style={[
                          tx.kind === "expense"
                            ? todayStyles.txAmtExpense
                            : todayStyles.txAmtIncome,
                          amountFont,
                        ]}
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
