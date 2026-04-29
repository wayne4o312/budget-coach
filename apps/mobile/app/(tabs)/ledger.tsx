import { Pressable, ScrollView, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Text } from "@/components/ui/text";
import { formatCny } from "@/src/domain/money";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GlassPanel } from "@/components/ui/glass-panel";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  getCategoryBreakdown,
  getSummary,
  getTrend,
  rangeFor,
  type CategoryPoint,
  type LedgerSummary,
  type TrendPoint,
  type TxKind,
} from "@/src/domain/ledgerStats";
import { CartesianChart, Line, Pie, PolarChart } from "victory-native";

type Granularity = "day" | "week" | "month" | "year";

const GRANULARITIES: { id: Granularity; label: string }[] = [
  { id: "day", label: "日" },
  { id: "week", label: "周" },
  { id: "month", label: "月" },
  { id: "year", label: "年" },
];

function formatRangeTitle(anchor: Date, g: Granularity): string {
  const y = anchor.getFullYear();
  const m = anchor.getMonth() + 1;
  const d = anchor.getDate();

  if (g === "day") {
    const center = new Date(anchor);
    center.setHours(0, 0, 0, 0);
    const start = new Date(center);
    start.setDate(start.getDate() - 7);
    const end = new Date(center);
    end.setDate(end.getDate() + 7);

    const sm = start.getMonth() + 1;
    const sd = start.getDate();
    const em = end.getMonth() + 1;
    const ed = end.getDate();

    const weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][
      anchor.getDay()
    ];
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(
      2,
      "0"
    )} ${weekday} · ${sm}/${sd}-${em}/${ed}`;
  }
  if (g === "month") return `${y}年${m}月`;
  if (g === "year") return `${y}年`;

  // week: display week start ~ end
  const start = new Date(anchor);
  const day = start.getDay();
  const diffToMon = (day + 6) % 7; // Mon=0 ... Sun=6
  start.setDate(start.getDate() - diffToMon);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const sm = start.getMonth() + 1;
  const sd = start.getDate();
  const em = end.getMonth() + 1;
  const ed = end.getDate();
  return `${y}年${sm}月${sd}日 - ${em}月${ed}日`;
}

function shiftAnchor(anchor: Date, g: Granularity, dir: -1 | 1): Date {
  const a = new Date(anchor);
  if (g === "day") a.setDate(a.getDate() + dir);
  else if (g === "week") a.setDate(a.getDate() + dir * 7);
  else if (g === "month") a.setMonth(a.getMonth() + dir);
  else a.setFullYear(a.getFullYear() + dir);
  return a;
}

function buildEvenlySpacedTickIndices(
  n: number,
  maxTicks: number
): Set<number> {
  const ticks = new Set<number>();
  if (n <= 0) return ticks;
  if (n === 1) {
    ticks.add(0);
    return ticks;
  }
  const k = Math.min(maxTicks, n);
  if (k === 2) {
    ticks.add(0);
    ticks.add(n - 1);
    return ticks;
  }
  const step = (n - 1) / (k - 1);
  for (let i = 0; i < k; i++) {
    ticks.add(Math.round(i * step));
  }
  ticks.add(0);
  ticks.add(n - 1);
  return ticks;
}

function SegmentedTabs(props: {
  value: Granularity;
  onChange: (v: Granularity) => void;
}) {
  const activeIndex = Math.max(
    0,
    GRANULARITIES.findIndex((x) => x.id === props.value)
  );
  const progress = useSharedValue(activeIndex);
  const [w, setW] = useState(0);
  const tabsN = GRANULARITIES.length;

  useEffect(() => {
    progress.value = withTiming(activeIndex, {
      duration: 320,
      easing: Easing.inOut(Easing.quad),
    });
  }, [activeIndex, progress]);

  const pillStyle = useAnimatedStyle(() => {
    const tabW = w > 0 ? w / tabsN : 0;
    const x = interpolate(
      progress.value,
      [0, tabsN - 1],
      [0, tabW * (tabsN - 1)]
    );
    return {
      transform: [{ translateX: x }],
      width: tabW,
    };
  });

  return (
    <GlassPanel
      intensity={32}
      className="overflow-hidden rounded-2xl"
      style={{ padding: 4 }}
    >
      <View
        className="relative flex-row"
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
      >
        {/* active pill */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              borderRadius: 16,
              backgroundColor: "rgba(234, 243, 231, 0.90)",
              shadowColor: "rgba(0,0,0,1)",
              shadowOpacity: 0.1,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 6 },
            },
            pillStyle,
          ]}
        />

        {GRANULARITIES.map((t) => {
          const active = props.value === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => {
                // keep press response immediate; animate pill, then update content.
                progress.value = withTiming(
                  Math.max(
                    0,
                    GRANULARITIES.findIndex((x) => x.id === t.id)
                  ),
                  { duration: 260, easing: Easing.inOut(Easing.quad) },
                  () => runOnJS(props.onChange)(t.id)
                );
              }}
              className="flex-1 items-center justify-center px-3 py-2 active:opacity-90"
            >
              <Text
                className="text-[13px]"
                style={{
                  color: active ? "rgba(18,22,16,0.88)" : "rgba(15,18,14,0.52)",
                }}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </GlassPanel>
  );
}

export default function LedgerScreen() {
  const insets = useSafeAreaInsets();
  const [g, setG] = useState<Granularity>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // latest fetched data (kept for potential future drilldowns)
  const [_summary, setSummary] = useState<LedgerSummary>({
    expenseCents: 0,
    incomeCents: 0,
    netCents: 0,
  });
  const [_trend, setTrend] = useState<TrendPoint[]>([]);
  const [kindForBreakdown, setKindForBreakdown] = useState<TxKind>("expense");
  const [_breakdown, setBreakdown] = useState<CategoryPoint[]>([]);

  // rendered data: keep previous values while loading to avoid flicker
  const [shownSummary, setShownSummary] = useState<LedgerSummary>({
    expenseCents: 0,
    incomeCents: 0,
    netCents: 0,
  });
  const [shownTrend, setShownTrend] = useState<TrendPoint[]>([]);
  const [shownBreakdown, setShownBreakdown] = useState<CategoryPoint[]>([]);

  const title = useMemo(() => formatRangeTitle(anchor, g), [anchor, g]);
  const range = useMemo(() => rangeFor(anchor, g), [anchor, g]);

  const onPrev = () => setAnchor((d) => shiftAnchor(d, g, -1));
  const onNext = () => setAnchor((d) => shiftAnchor(d, g, 1));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [s, t, b] = await Promise.all([
          getSummary(range),
          getTrend(range, g, "expense", anchor),
          getCategoryBreakdown(range, kindForBreakdown),
        ]);
        if (cancelled) return;
        setSummary(s);
        setTrend(t);
        setBreakdown(b);
        setShownSummary(s);
        setShownTrend(t);
        setShownBreakdown(b);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [anchor, g, kindForBreakdown, range]);

  const pieData = useMemo(() => {
    if (shownBreakdown.length === 0) return [];
    const colors = [
      "rgba(171,121,66,0.95)",
      "rgba(122,105,89,0.85)",
      "rgba(236,223,205,0.95)",
      "rgba(208,190,170,0.95)",
      "rgba(163,47,45,0.80)",
      "rgba(28,24,20,0.55)",
    ];
    return shownBreakdown.map((x, i) => ({
      value: Math.max(0, x.value),
      text: x.label,
      color: colors[i % colors.length],
    }));
  }, [shownBreakdown]);

  const hasAnyData =
    shownSummary.expenseCents > 0 || shownSummary.incomeCents > 0;

  const trendYuan = useMemo(
    () =>
      shownTrend.map((p, idx) => ({
        x: idx,
        y: p.value / 100,
        label: p.label,
      })),
    [shownTrend]
  );
  const tickIndex = useMemo(() => {
    const n = shownTrend.length;
    if (n <= 0) return [];
    const set =
      g === "week"
        ? new Set<number>([0, 1, 2, 3, 4, 5, 6].filter((x) => x < n))
        : buildEvenlySpacedTickIndices(n, 6);
    return Array.from(set).sort((a, b) => a - b);
  }, [g, shownTrend.length]);

  // soften the perceived "flash" when switching segmented tabs
  const contentT = useSharedValue(1);
  useEffect(() => {
    // tie the transition to granularity changes
    void g;
    contentT.value = 0;
    contentT.value = withTiming(1, {
      duration: 260,
      easing: Easing.inOut(Easing.quad),
    });
  }, [g, contentT]);

  const contentAnimStyle = useAnimatedStyle(() => {
    const o = interpolate(contentT.value, [0, 1], [0.86, 1]);
    const y = interpolate(contentT.value, [0, 1], [2, 0]);
    return { opacity: o, transform: [{ translateY: y }] };
  });

  return (
    <AuroraBackground variant="clean" decorations={false}>
      <View
        className="flex-1 px-5"
        style={{ paddingTop: Math.max(16, insets.top + 10) }}
      >
        {/* fixed segmented tabs */}
        <SegmentedTabs value={g} onChange={(v) => setG(v)} />

        {/* scrollable content below tabs */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: 16,
            // leave room for bottom tab bar + safe area so last card isn't covered
            paddingBottom: Math.max(18, insets.bottom + 18 + 52),
            // keep blank space color consistent with the page wash
            backgroundColor: "rgba(236, 243, 232, 0.28)",
          }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View className="gap-4" style={contentAnimStyle}>
            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={onPrev}
                className="h-9 w-9 items-center justify-center rounded-full bg-accent/35 active:opacity-90"
                accessibilityLabel="上一段时间"
              >
                <ChevronLeft size={18} color="rgba(28,24,20,0.85)" />
              </Pressable>

              <Text className="text-[14px] font-sansMedium text-foreground/90">
                {title}
              </Text>

              <Pressable
                onPress={onNext}
                className="h-9 w-9 items-center justify-center rounded-full bg-accent/35 active:opacity-90"
                accessibilityLabel="下一段时间"
              >
                <ChevronRight size={18} color="rgba(28,24,20,0.85)" />
              </Pressable>
            </View>

            <GlassPanel className="px-5 py-5">
              <View className="gap-3">
                <Text
                  className="text-[12px] tracking-[1.4px] font-sansMedium"
                  style={{ color: "rgba(15,18,14,0.54)" }}
                >
                  本期汇总
                </Text>
                <View className="flex-row items-baseline justify-between">
                  <View className="flex-1">
                    <Text
                      className="text-[12px]"
                      style={{ color: "rgba(15,18,14,0.50)" }}
                    >
                      支出
                    </Text>
                    <Text
                      className="mt-1 text-[18px] font-sansMedium"
                      style={{ color: "rgba(18,22,16,0.90)" }}
                    >
                      {loading && shownSummary.expenseCents === 0
                        ? "…"
                        : formatCny(shownSummary.expenseCents)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-[12px]"
                      style={{ color: "rgba(15,18,14,0.50)" }}
                    >
                      收入
                    </Text>
                    <Text
                      className="mt-1 text-[18px] font-sansMedium"
                      style={{ color: "rgba(18,22,16,0.90)" }}
                    >
                      {loading && shownSummary.incomeCents === 0
                        ? "…"
                        : formatCny(shownSummary.incomeCents)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-[12px]"
                      style={{ color: "rgba(15,18,14,0.50)" }}
                    >
                      结余
                    </Text>
                    <Text
                      className="mt-1 text-[18px] font-sansMedium"
                      style={{ color: "rgba(18,22,16,0.90)" }}
                    >
                      {loading && shownSummary.netCents === 0
                        ? "…"
                        : formatCny(Math.abs(shownSummary.netCents))}
                    </Text>
                  </View>
                </View>
              </View>
            </GlassPanel>

            <GlassPanel className="px-4 py-4">
              <Text className="text-[13px] font-sansMedium text-foreground/90">
                趋势
              </Text>
              {error ? (
                <Text className="mt-1 text-[12px] text-destructive">
                  {error}
                </Text>
              ) : null}
              {shownTrend.length === 0 && !loading ? (
                <Text
                  variant="muted"
                  className="mt-4 text-[12px] leading-[16px]"
                >
                  该时间段暂无记录
                </Text>
              ) : shownTrend.length > 0 ? (
                <View className="mt-4">
                  <View style={{ height: 190 }}>
                    <CartesianChart
                      data={trendYuan}
                      xKey="x"
                      yKeys={["y"]}
                      padding={{ left: 8, right: 8, top: 10, bottom: 10 }}
                      domainPadding={{
                        left: 14,
                        right: 14,
                        top: 10,
                        bottom: 10,
                      }}
                    >
                      {({ points }) => (
                        <Line
                          points={points.y}
                          color="rgba(171,121,66,0.92)"
                          strokeWidth={2}
                          curveType="monotoneX"
                        />
                      )}
                    </CartesianChart>

                    {/* X 轴刻度：用原生文字渲染（避免 Skia 字体依赖） */}
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        left: 8,
                        right: 8,
                        bottom: 0,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        paddingBottom: 6,
                      }}
                    >
                      {tickIndex.map((i) => (
                        <Text
                          key={i}
                          className="text-[10px]"
                          style={{ color: "rgba(15,18,14,0.44)" }}
                        >
                          {shownTrend[i]?.label ?? ""}
                        </Text>
                      ))}
                    </View>

                    {loading ? (
                      <View
                        pointerEvents="none"
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          bottom: 0,
                          left: 0,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 999,
                            backgroundColor: "rgba(255,255,255,0.18)",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.26)",
                          }}
                        >
                          <Text
                            className="text-[12px]"
                            style={{ color: "rgba(15,18,14,0.52)" }}
                          >
                            更新中…
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : (
                <View className="mt-4 h-32 rounded-xl bg-accent/25" />
              )}
            </GlassPanel>

            <GlassPanel className="px-4 pt-4 pb-6">
              <Text className="text-[13px] font-sansMedium text-foreground/90">
                分类占比
              </Text>
              {hasAnyData ? (
                <View className="mt-3 flex-row gap-2">
                  <Pressable
                    onPress={() => setKindForBreakdown("expense")}
                    className={`rounded-full px-3 py-1.5 active:opacity-90 ${
                      kindForBreakdown === "expense"
                        ? "bg-accent/60"
                        : "bg-accent/25"
                    }`}
                  >
                    <Text className="text-[12px] text-foreground/85">支出</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setKindForBreakdown("income")}
                    className={`rounded-full px-3 py-1.5 active:opacity-90 ${
                      kindForBreakdown === "income"
                        ? "bg-accent/60"
                        : "bg-accent/25"
                    }`}
                  >
                    <Text className="text-[12px] text-foreground/85">收入</Text>
                  </Pressable>
                </View>
              ) : null}

              {loading ? (
                <Text
                  variant="muted"
                  className="mt-2 text-[12px] leading-[16px]"
                >
                  图表加载中…
                </Text>
              ) : null}
              {pieData.length === 0 && !loading ? (
                <Text
                  variant="muted"
                  className="mt-4 text-[12px] leading-[16px]"
                >
                  该时间段暂无记录
                </Text>
              ) : pieData.length > 0 ? (
                <View className="mt-4 items-center justify-center">
                  <View
                    style={{
                      width: 168,
                      height: 168,
                      // ensure the Skia surface visually matches the panel background
                      backgroundColor: "rgba(236, 243, 232, 0.72)",
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <PolarChart
                      data={shownBreakdown.map((x, idx) => ({
                        label: x.label,
                        value: Math.max(0, x.value),
                        color:
                          pieData[idx % pieData.length]?.color ??
                          "rgba(171,121,66,0.92)",
                      }))}
                      labelKey="label"
                      valueKey="value"
                      colorKey="color"
                    >
                      <Pie.Chart innerRadius={56} size={168}>
                        {() => <Pie.Slice />}
                      </Pie.Chart>
                    </PolarChart>
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        className="text-[12px]"
                        style={{ color: "rgba(15,18,14,0.50)" }}
                      >
                        {kindForBreakdown === "expense" ? "支出" : "收入"}
                      </Text>
                      <Text
                        className="mt-1 text-[14px] font-sansMedium"
                        style={{ color: "rgba(18,22,16,0.90)" }}
                      >
                        {formatCny(
                          shownBreakdown.reduce((acc, x) => acc + x.value, 0)
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View className="mt-4 h-40 rounded-xl bg-accent/25" />
              )}
            </GlassPanel>
          </Animated.View>
        </ScrollView>
      </View>
    </AuroraBackground>
  );
}
