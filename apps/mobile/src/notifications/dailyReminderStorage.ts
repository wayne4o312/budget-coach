import * as SecureStore from "expo-secure-store";

import type { SceneId } from "@/src/domain/scenes";

import type { ReminderRule } from "./reminders";
import { upsertReminder } from "./reminders";

const STORAGE_KEY = "budgetcoach.dailyReminder.v1";

export type StoredDailyReminder = {
  enabled: boolean;
  hour: number;
  minute: number;
  scene: SceneId;
  notificationId?: string;
};

const DEFAULT_PREFS: Omit<StoredDailyReminder, "notificationId"> = {
  enabled: false,
  hour: 21,
  minute: 0,
  scene: "bedtime",
};

async function read(): Promise<StoredDailyReminder | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDailyReminder;
    if (typeof parsed.hour !== "number" || typeof parsed.minute !== "number")
      return null;
    return parsed;
  } catch {
    return null;
  }
}

async function write(prefs: StoredDailyReminder): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(prefs));
}

/** 启动时根据本地存储重新注册系统定时通知 */
export async function hydrateDailyReminderSchedule(): Promise<void> {
  const prefs = await read();
  if (!prefs) return;
  const rule = await upsertReminder(
    prefs.enabled && prefs.notificationId
      ? {
          scene: prefs.scene,
          enabled: prefs.enabled,
          hour: prefs.hour,
          minute: prefs.minute,
          notificationId: prefs.notificationId,
        }
      : undefined,
    {
      scene: prefs.scene,
      enabled: prefs.enabled,
      hour: prefs.hour,
      minute: prefs.minute,
    },
  );
  await write({
    enabled: rule.enabled,
    hour: rule.hour,
    minute: rule.minute,
    scene: rule.scene,
    notificationId: rule.notificationId,
  });
}

export async function loadDailyReminderPrefs(): Promise<StoredDailyReminder> {
  const prefs = await read();
  if (!prefs) return { ...DEFAULT_PREFS };
  return {
    ...DEFAULT_PREFS,
    ...prefs,
    scene: prefs.scene ?? DEFAULT_PREFS.scene,
  };
}

/** 用户修改设置后调用：更新调度并写回存储 */
export async function saveDailyReminderFromRule(
  prev: StoredDailyReminder,
  next: Omit<ReminderRule, "notificationId">,
): Promise<StoredDailyReminder> {
  const rule = await upsertReminder(
    prev.enabled || prev.notificationId
      ? {
          scene: prev.scene,
          enabled: prev.enabled,
          hour: prev.hour,
          minute: prev.minute,
          notificationId: prev.notificationId,
        }
      : undefined,
    next,
  );
  const stored: StoredDailyReminder = {
    enabled: rule.enabled,
    hour: rule.hour,
    minute: rule.minute,
    scene: rule.scene,
    notificationId: rule.notificationId,
  };
  await write(stored);
  return stored;
}
