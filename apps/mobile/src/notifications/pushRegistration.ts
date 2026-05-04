import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { getSession } from "@/src/auth/session";
import { env as appEnv } from "@/src/config/env";
import { apiFetch } from "@/src/lib/api";

function getEasProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;
  const fromExtra = extra?.eas?.projectId?.trim();
  if (fromExtra) return fromExtra;
  const fromEnv = appEnv.EAS_PROJECT_ID?.trim();
  if (fromEnv) return fromEnv;
  return undefined;
}

/**
 * 登录后调用：请求通知权限、获取 Expo Push Token 并上报到 `/api/notifications/push-tokens`。
 * 未配置 EAS `projectId`、未登录、模拟器失败时会静默跳过（开发环境打日志）。
 */
export async function registerExpoPushTokenForCurrentUser(): Promise<void> {
  const { data } = await getSession();
  if (!data.session?.user?.id) return;

  const projectId = getEasProjectId();
  if (!projectId) {
    if (__DEV__) {
      console.warn(
        "[push] 缺少 EAS projectId：在 app.json → expo.extra.eas.projectId 填写，或设置 EXPO_PUBLIC_EAS_PROJECT_ID（运行 eas init 后可得）。",
      );
    }
    return;
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return;

  let expoPushToken: string;
  try {
    const tokenRes = await Notifications.getExpoPushTokenAsync({ projectId });
    expoPushToken = tokenRes.data;
  } catch (e) {
    if (__DEV__) console.warn("[push] getExpoPushTokenAsync:", e);
    return;
  }

  try {
    await apiFetch<{ ok: boolean }>("/api/notifications/push-tokens", {
      method: "POST",
      json: {
        platform: Platform.OS === "ios" ? "ios" : "android",
        expoPushToken,
      },
    });
  } catch (e) {
    if (__DEV__) console.warn("[push] push-tokens register failed:", e);
  }
}
