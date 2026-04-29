import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import type { SceneId, SceneTemplate } from "@/src/domain/scenes";
import { DEFAULT_SCENES } from "@/src/domain/scenes";
import type { QuickAddSlot } from "@/src/domain/quickAdd";
import {
  ensureQuickAddDefaults,
  listQuickAddSlots,
  saveQuickAddSlots,
} from "@/src/domain/quickAdd";

type SlotDraft = Omit<QuickAddSlot, "id"> & { id?: string };

function parseAmounts(input: string): number[] {
  return input
    .split(/[,\s]+/g)
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .map((n) => Math.round(n));
}

const CATEGORY_OPTIONS = ["餐饮", "出行", "生活", "其他"] as const;
type CategoryOption = (typeof CATEGORY_OPTIONS)[number];

export default function QuickAddSettingsScreen() {
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<SlotDraft[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setAuthError(null);
        await ensureQuickAddDefaults();
        const slots = await listQuickAddSlots();
        if (cancelled) return;
        setReady(true);
        setDrafts(
          slots.map((s) => ({
            id: s.id,
            position: s.position,
            kind: s.kind,
            sceneId: s.sceneId ?? null,
            customTitle: s.customTitle ?? null,
            customCategory: s.customCategory ?? null,
            customIcon: s.customIcon ?? null,
            suggestedAmounts: s.suggestedAmounts ?? [],
          })),
        );
      } catch {
        // Not logged in yet, or table not ready.
        if (cancelled) return;
        setReady(false);
        setAuthError("请先登录后再配置 Quick Add。");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sceneOptions = useMemo(() => DEFAULT_SCENES, []);

  const updateDraft = (position: number, next: Partial<SlotDraft>) => {
    setDrafts((prev) =>
      prev.map((d) => (d.position === position ? { ...d, ...next } : d)),
    );
  };

  const move = (position: number, dir: -1 | 1) => {
    setDrafts((prev) => {
      const idx = prev.findIndex((d) => d.position === position);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev].sort((a, b) => a.position - b.position);
      const a = copy[idx];
      const b = copy[j];
      // swap positions
      const swapped = copy.map((x) => {
        if (x.position === a.position) return { ...x, position: b.position };
        if (x.position === b.position) return { ...x, position: a.position };
        return x;
      });
      return swapped.sort((x, y) => x.position - y.position);
    });
  };

  const addSlot = () => {
    setDrafts((prev) => {
      const nextPos = prev.length;
      return [
        ...prev,
        {
          position: nextPos,
          kind: "custom",
          customTitle: "Custom",
          customCategory: "其他",
          customIcon: "notebook-pen" satisfies SceneTemplate["icon"],
          suggestedAmounts: [10, 20, 50, 100],
        },
      ];
    });
  };

  const removeLastSlot = () => {
    setDrafts((prev) => (prev.length <= 1 ? prev : prev.slice(0, -1)));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const normalized = drafts
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((d, idx) => ({
          position: idx,
          kind: d.kind,
          sceneId: d.kind === "scene" ? (d.sceneId ?? null) : null,
          customTitle: d.kind === "custom" ? (d.customTitle ?? "Custom") : null,
          customCategory: d.kind === "custom" ? (d.customCategory ?? "其他") : null,
          customIcon: d.kind === "custom" ? (d.customIcon ?? "notebook-pen") : null,
          suggestedAmounts: d.kind === "custom" ? d.suggestedAmounts ?? [] : [],
        }));
      await saveQuickAddSlots(normalized);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background px-5 py-5">
      <View className="gap-4">
        <View className="flex-row items-center justify-between">
          <Text variant="h3" className="text-left">
            Quick Add 模板
          </Text>
          <Pressable
            className="rounded-sm border border-border bg-card px-3 py-2 active:opacity-90"
            onPress={() => router.back()}
          >
            <Text>返回</Text>
          </Pressable>
        </View>

        {authError ? <Text className="text-destructive">{authError}</Text> : null}

        <Card>
          <CardHeader>
            <CardTitle>首页卡片</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <Text variant="muted" className="leading-[18px]">
              这里配置首页底部的 Quick Add 卡片。支持选用内置模板（餐饮/通勤等）以及自定义位（自定义标题与金额）。
            </Text>

            <View className="gap-3">
              {drafts
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((d, idx) => (
                  <View key={`slot-${d.position}`} className="gap-3">
                    <View className="flex-row items-center justify-between">
                      <Text variant="h4" className="text-left">
                        Slot {idx + 1}
                      </Text>
                      <View className="flex-row gap-2">
                        <Pressable
                          className="rounded-sm border border-border bg-card px-3 py-2 active:opacity-90"
                          onPress={() => move(d.position, -1)}
                          disabled={idx === 0}
                        >
                          <Text>上移</Text>
                        </Pressable>
                        <Pressable
                          className="rounded-sm border border-border bg-card px-3 py-2 active:opacity-90"
                          onPress={() => move(d.position, 1)}
                          disabled={idx === drafts.length - 1}
                        >
                          <Text>下移</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View className="flex-row gap-2">
                      <Pressable
                        className={`flex-1 rounded-sm border px-3 py-2 active:opacity-90 ${
                          d.kind === "scene"
                            ? "border-foreground bg-secondary"
                            : "border-border bg-card"
                        }`}
                        onPress={() =>
                          updateDraft(d.position, {
                            kind: "scene",
                            sceneId: (d.sceneId ?? ("commute" as SceneId)),
                          })
                        }
                      >
                        <Text>内置模板</Text>
                      </Pressable>
                      <Pressable
                        className={`flex-1 rounded-sm border px-3 py-2 active:opacity-90 ${
                          d.kind === "custom"
                            ? "border-foreground bg-secondary"
                            : "border-border bg-card"
                        }`}
                        onPress={() =>
                          updateDraft(d.position, {
                            kind: "custom",
                            customTitle: d.customTitle ?? "Custom",
                            customCategory: d.customCategory ?? "其他",
                            customIcon: (d.customIcon ??
                              ("notebook-pen" as SceneTemplate["icon"])),
                            suggestedAmounts:
                              d.suggestedAmounts?.length
                                ? d.suggestedAmounts
                                : [10, 20, 50, 100],
                          })
                        }
                      >
                        <Text>自定义</Text>
                      </Pressable>
                    </View>

                    {d.kind === "scene" ? (
                      <View className="gap-2">
                        <Text variant="muted">选择一个模板</Text>
                        <View className="flex-row flex-wrap gap-2">
                          {sceneOptions.map((s) => (
                            <Pressable
                              key={s.id}
                              className={`rounded-sm border px-3 py-2 active:opacity-90 ${
                                d.sceneId === s.id
                                  ? "border-foreground bg-secondary"
                                  : "border-border bg-card"
                              }`}
                              onPress={() =>
                                updateDraft(d.position, { sceneId: s.id })
                              }
                            >
                              <Text>{s.title}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    ) : (
                      <View className="gap-3">
                        <View className="gap-2">
                          <Text variant="muted">标题</Text>
                          <Input
                            value={d.customTitle ?? ""}
                            onChangeText={(v) =>
                              updateDraft(d.position, { customTitle: v })
                            }
                          />
                        </View>
                        <View className="gap-2">
                          <Text variant="muted">分类（影响卡片配色）</Text>
                          <View className="flex-row flex-wrap gap-2">
                            {CATEGORY_OPTIONS.map((opt) => {
                              const selected =
                                (d.customCategory as CategoryOption | null) === opt;
                              return (
                                <Pressable
                                  key={opt}
                                  className={`rounded-sm border px-3 py-2 active:opacity-90 ${
                                    selected
                                      ? "border-foreground bg-secondary"
                                      : "border-border bg-card"
                                  }`}
                                  onPress={() =>
                                    updateDraft(d.position, {
                                      customCategory: opt,
                                    })
                                  }
                                >
                                  <Text>{opt}</Text>
                                </Pressable>
                              );
                            })}
                          </View>
                          <Text variant="muted" className="leading-[18px]">
                            建议保持分类精简：餐饮 / 出行 / 生活 / 其他。
                          </Text>
                        </View>
                        <View className="gap-2">
                          <Text variant="muted">金额（逗号分隔）</Text>
                          <Input
                            value={(d.suggestedAmounts ?? []).join(",")}
                            onChangeText={(v) =>
                              updateDraft(d.position, {
                                suggestedAmounts: parseAmounts(v),
                              })
                            }
                            placeholder="10,20,50,100"
                          />
                        </View>
                      </View>
                    )}

                    <Separator />
                  </View>
                ))}
            </View>

            <View className="flex-row gap-2">
              <Button className="flex-1" onPress={addSlot}>
                <Text>新增一个 Slot</Text>
              </Button>
              <Button
                className="flex-1"
                variant="secondary"
                onPress={removeLastSlot}
              >
                <Text>删除最后一个</Text>
              </Button>
            </View>
          </CardContent>
        </Card>

        <Button onPress={onSave} disabled={!ready || saving}>
          <Text>{saving ? "保存中…" : "保存并返回"}</Text>
        </Button>
      </View>
    </ScrollView>
  );
}

