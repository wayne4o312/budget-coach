import type { SceneId, SceneTemplate } from "@/src/domain/scenes";
import { DEFAULT_SCENES } from "@/src/domain/scenes";
import { apiFetch } from "@/src/lib/api";

export type QuickAddKind = "scene" | "custom";

export type QuickAddSlot = {
  id: string;
  position: number;
  kind: QuickAddKind;
  sceneId?: SceneId | null;
  customTitle?: string | null;
  customCategory?: string | null;
  customIcon?: SceneTemplate["icon"] | null;
  suggestedAmounts: number[];
};

function normalizeAmounts(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((n) => (typeof n === "number" ? n : Number(n)))
    .filter((n) => Number.isFinite(n))
    .map((n) => Math.round(n))
    .filter((n) => n > 0);
}

export async function listQuickAddSlots(): Promise<QuickAddSlot[]> {
  const res = await apiFetch<{
    ok: boolean;
    slots: Array<{
      position: number;
      kind: QuickAddKind;
      sceneId?: string | null;
      customTitle?: string | null;
      customCategory?: string | null;
      customIcon?: string | null;
      suggestedAmounts?: unknown;
    }>;
  }>("/api/quick-add/slots");

  return (res.slots ?? []).map((r) => ({
    id: `${r.kind}-${r.position}`,
    position: r.position,
    kind: r.kind,
    sceneId: (r.sceneId as SceneId | null) ?? null,
    customTitle: r.customTitle ?? null,
    customCategory: r.customCategory ?? null,
    customIcon: (r.customIcon as SceneTemplate["icon"] | null) ?? null,
    suggestedAmounts: normalizeAmounts(r.suggestedAmounts ?? []),
  }));
}

export async function ensureQuickAddDefaults(): Promise<void> {
  // Server guarantees defaults on first GET.
  return;
}

export function resolveSlotTemplate(slot: QuickAddSlot): {
  title: string;
  icon: SceneTemplate["icon"];
  defaultCategory: string;
  suggestedAmounts: number[];
  sceneId?: SceneId;
  isCustom: boolean;
} {
  if (slot.kind === "scene" && slot.sceneId) {
    const t = DEFAULT_SCENES.find((s) => s.id === slot.sceneId);
    if (t) {
      return {
        title: t.title,
        icon: t.icon,
        defaultCategory: t.defaultCategory,
        suggestedAmounts: t.suggestedAmounts,
        sceneId: t.id,
        isCustom: false,
      };
    }
  }
  return {
    title: slot.customTitle?.trim() || "Custom",
    icon: slot.customIcon || "notebook-pen",
    defaultCategory: slot.customCategory?.trim() || "其他",
    suggestedAmounts:
      slot.suggestedAmounts.length > 0 ? slot.suggestedAmounts : [10, 20, 50, 100],
    isCustom: true,
  };
}

export async function saveQuickAddSlots(
  slots: Array<
    Omit<QuickAddSlot, "id"> & { id?: string; sceneId?: SceneId | null }
  >,
): Promise<void> {
  await apiFetch("/api/quick-add/slots", {
    method: "PUT",
    json: {
      slots: slots.map((s) => ({
        position: s.position,
        kind: s.kind,
        sceneId: s.sceneId ?? null,
        customTitle: s.customTitle ?? null,
        customCategory: s.customCategory ?? null,
        customIcon: s.customIcon ?? null,
        suggestedAmounts: s.suggestedAmounts ?? [],
      })),
    },
  });
}

