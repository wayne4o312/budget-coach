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
import { ledgerStyles } from "@/src/screenStyles/ledgerTab.styles";
import {
  INCOME_PIE_COLORS,
  PIE_CHART_LABEL_COLOR,
  pieColorForExpenseCategoryLabel,
} from "@/src/domain/spendCategories";
import {
  Group,
  Text as SkiaText,
  useFont,
  type SkFont,
} from "@shopify/react-native-skia";
import { CartesianChart, Line, Pie, PolarChart } from "victory-native";

function skiaTextWidth(text: string, font: SkFont | null): number {
  if (!font || !text) return 0;
  return font.getGlyphWidths(font.getGlyphIDs(text)).reduce((a, b) => a + b, 0);
}

type Granularity = "day" | "week" | "month" | "year";

const PIE_CHART_SIZE = 160;

/** 扇形 + 扇区内仅显示占比 %（类目在下方列表） */
function LedgerPieChart(props: {
  rows: { label: string; value: number; color: string }[];
  pieTotalCents: number;
}) {
  const { rows, pieTotalCents } = props;
  const font = useFont(require("../../assets/fonts/DINPro-Medium.otf"), 11);

  return (
    <View style={{ width: PIE_CHART_SIZE, height: PIE_CHART_SIZE }}>
      <PolarChart
        data={rows}
        labelKey="label"
        valueKey="value"
        colorKey="color"
      >
        <Pie.Chart innerRadius={0} size={PIE_CHART_SIZE}>
          {({ slice }) => {
            const pct =
              pieTotalCents > 0
                ? Math.round((slice.value / pieTotalCents) * 100)
                : 0;
            const showPct = font != null && slice.sweepAngle >= 13;
            return (
              <Pie.Slice>
                {showPct ? (
                  <Pie.Label
                    font={font}
                    radiusOffset={0.5}
                    color={PIE_CHART_LABEL_COLOR}
                    text={`${pct}%`}
                  />
                ) : null}
              </Pie.Slice>
            );
          }}
        </Pie.Chart>
      </PolarChart>
    </View>
  );
}

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
      duration: 240,
      easing: Easing.out(Easing.cubic),
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
    <GlassPanel intensity={32} style={ledgerStyles.segmentGlass}>
      <View
        style={ledgerStyles.segmentRow}
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
                const idx = Math.max(
                  0,
                  GRANULARITIES.findIndex((x) => x.id === t.id)
                );
                progress.value = withTiming(idx, {
                  duration: 240,
                  easing: Easing.out(Easing.cubic),
                });
                props.onChange(t.id);
              }}
              style={ledgerStyles.segmentHit}
            >
              <Text
                style={[
                  ledgerStyles.segmentLabel,
                  {
                    color: active
                      ? "rgba(18,22,16,0.88)"
                      : "rgba(15,18,14,0.52)",
                  },
                ]}
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
    return shownBreakdown.map((x, i) => ({
      value: Math.max(0, x.value),
      text: x.label,
      color:
        kindForBreakdown === "expense"
          ? pieColorForExpenseCategoryLabel(x.label)
          : INCOME_PIE_COLORS[i % INCOME_PIE_COLORS.length],
    }));
  }, [shownBreakdown, kindForBreakdown]);

  const pieTotalCents = useMemo(
    () => pieData.reduce((acc, x) => acc + x.value, 0),
    [pieData]
  );

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

  /** 折线最高点（按支出金额分）；用于在峰顶标注金额 */
  const trendPeak = useMemo(() => {
    if (shownTrend.length === 0) return null;
    let idx = 0;
    let maxV = shownTrend[0]?.value ?? 0;
    for (let i = 1; i < shownTrend.length; i++) {
      const v = shownTrend[i]?.value ?? 0;
      if (v > maxV) {
        maxV = v;
        idx = i;
      }
    }
    return { index: idx, cents: maxV };
  }, [shownTrend]);

  const trendPeakLabelFont = useFont(
    require("../../assets/fonts/DINPro-Medium.otf"),
    11
  );

  return (
    <AuroraBackground variant="clean" decorations={false}>
      <View
        style={[
          ledgerStyles.rootColumn,
          { paddingTop: Math.max(16, insets.top + 10) },
        ]}
      >
        {/* fixed segmented tabs */}
        <SegmentedTabs value={g} onChange={(v) => setG(v)} />

        {/* scrollable content below tabs */}
        <ScrollView
          style={ledgerStyles.scroll}
          contentContainerStyle={{
            paddingTop: 16,
            // leave room for bottom tab bar + safe area so last card isn't covered
            paddingBottom: Math.max(18, insets.bottom + 18 + 52),
            // keep blank space color consistent with the page wash
            backgroundColor: "rgba(236, 243, 232, 0.28)",
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={ledgerStyles.stackGap16}>
            <View style={ledgerStyles.rowBetween}>
              <Pressable
                onPress={onPrev}
                style={ledgerStyles.navRoundBtn}
                accessibilityLabel="上一段时间"
              >
                <ChevronLeft size={18} color="rgba(28,24,20,0.85)" />
              </Pressable>

              <Text style={ledgerStyles.rangeTitle}>{title}</Text>

              <Pressable
                onPress={onNext}
                style={ledgerStyles.navRoundBtn}
                accessibilityLabel="下一段时间"
              >
                <ChevronRight size={18} color="rgba(28,24,20,0.85)" />
              </Pressable>
            </View>

            <GlassPanel style={ledgerStyles.glassPad20}>
              <View style={ledgerStyles.cardStackGap12}>
                <Text style={ledgerStyles.sectionEyebrow}>本期汇总</Text>
                <View style={ledgerStyles.summaryRow}>
                  <View style={ledgerStyles.summaryCol}>
                    <Text style={ledgerStyles.summaryLabel}>支出</Text>
                    <Text style={ledgerStyles.summaryValue}>
                      {loading && shownSummary.expenseCents === 0
                        ? "…"
                        : formatCny(shownSummary.expenseCents)}
                    </Text>
                  </View>
                  <View style={ledgerStyles.summaryCol}>
                    <Text style={ledgerStyles.summaryLabel}>收入</Text>
                    <Text style={ledgerStyles.summaryValue}>
                      {loading && shownSummary.incomeCents === 0
                        ? "…"
                        : formatCny(shownSummary.incomeCents)}
                    </Text>
                  </View>
                  <View style={ledgerStyles.summaryCol}>
                    <Text style={ledgerStyles.summaryLabel}>结余</Text>
                    <Text style={ledgerStyles.summaryValue}>
                      {loading && shownSummary.netCents === 0
                        ? "…"
                        : formatCny(Math.abs(shownSummary.netCents))}
                    </Text>
                  </View>
                </View>
              </View>
            </GlassPanel>

            <GlassPanel style={ledgerStyles.glassPad16}>
              <Text style={ledgerStyles.sectionTitle}>趋势</Text>
              {error ? (
                <Text style={ledgerStyles.errorText}>{error}</Text>
              ) : null}
              {shownTrend.length === 0 && !loading ? (
                <Text variant="muted" style={ledgerStyles.mutedSmall}>
                  该时间段暂无记录
                </Text>
              ) : shownTrend.length > 0 ? (
                <View style={ledgerStyles.chartWrap}>
                  <View style={{ height: 190 }}>
                    <CartesianChart
                      data={trendYuan}
                      xKey="x"
                      yKeys={["y"]}
                      padding={{ left: 8, right: 8, top: 22, bottom: 10 }}
                      domainPadding={{
                        left: 14,
                        right: 14,
                        top: 18,
                        bottom: 10,
                      }}
                      renderOutside={
                        trendPeak && trendPeakLabelFont
                          ? ({ points }) => {
                              const pt = points.y[trendPeak.index];
                              if (
                                pt == null ||
                                pt.y == null ||
                                typeof pt.x !== "number"
                              ) {
                                return null;
                              }
                              const label = formatCny(trendPeak.cents);
                              const tw = skiaTextWidth(
                                label,
                                trendPeakLabelFont
                              );
                              return (
                                <Group>
                                  <SkiaText
                                    font={trendPeakLabelFont}
                                    text={label}
                                    x={pt.x - tw / 2}
                                    y={pt.y - 16}
                                    color="rgba(28, 32, 38, 0.88)"
                                  />
                                </Group>
                              );
                            }
                          : undefined
                      }
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
                          style={[
                            ledgerStyles.tickLabel,
                            { color: "rgba(15,18,14,0.44)" },
                          ]}
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
                          <Text style={ledgerStyles.loadingCapsuleText}>
                            更新中…
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : (
                <View style={ledgerStyles.placeholderTrend} />
              )}
            </GlassPanel>

            <GlassPanel style={ledgerStyles.glassPad16TopWide}>
              <Text style={ledgerStyles.sectionTitle}>
                {!hasAnyData || kindForBreakdown === "expense"
                  ? "消费分类占比"
                  : "收入分类占比"}
              </Text>
              {hasAnyData ? (
                <View style={ledgerStyles.chipRow}>
                  <Pressable
                    onPress={() => setKindForBreakdown("expense")}
                    style={[
                      ledgerStyles.chipBase,
                      kindForBreakdown === "expense"
                        ? ledgerStyles.chipOn
                        : ledgerStyles.chipOff,
                    ]}
                  >
                    <Text style={ledgerStyles.chipLabel}>支出</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setKindForBreakdown("income")}
                    style={[
                      ledgerStyles.chipBase,
                      kindForBreakdown === "income"
                        ? ledgerStyles.chipOn
                        : ledgerStyles.chipOff,
                    ]}
                  >
                    <Text style={ledgerStyles.chipLabel}>收入</Text>
                  </Pressable>
                </View>
              ) : null}

              {loading ? (
                <Text
                  variant="muted"
                  style={{ marginTop: 8, fontSize: 12, lineHeight: 16 }}
                >
                  图表加载中…
                </Text>
              ) : null}
              {pieData.length === 0 && !loading ? (
                <Text variant="muted" style={ledgerStyles.mutedSmall}>
                  该时间段暂无记录
                </Text>
              ) : pieData.length > 0 ? (
                <View style={ledgerStyles.pieOuter}>
                  <View
                    style={{
                      width: PIE_CHART_SIZE,
                      height: PIE_CHART_SIZE,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "rgba(236, 243, 232, 0.72)",
                      borderRadius: 999,
                    }}
                  >
                    <LedgerPieChart
                      rows={pieData.map((p) => ({
                        label: p.text,
                        value: p.value,
                        color: p.color,
                      }))}
                      pieTotalCents={pieTotalCents}
                    />
                  </View>

                  <View style={ledgerStyles.legendWrap}>
                    {pieData.map((p) => (
                      <View
                        key={`${p.text}-${p.value}`}
                        style={ledgerStyles.legendRow}
                      >
                        <View style={ledgerStyles.legendLeft}>
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: p.color,
                            }}
                          />
                          <Text
                            style={ledgerStyles.legendName}
                            numberOfLines={1}
                          >
                            {p.text}
                          </Text>
                        </View>
                        <Text style={ledgerStyles.legendAmt} numberOfLines={1}>
                          {formatCny(p.value)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={ledgerStyles.placeholderPie} />
              )}
            </GlassPanel>
          </View>
        </ScrollView>
      </View>
    </AuroraBackground>
  );
}
