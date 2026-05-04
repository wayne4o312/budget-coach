import { useEffect } from "react";

import { onAuthStateChange } from "@/src/auth/session";

import { hydrateDailyReminderSchedule } from "./dailyReminderStorage";
import { registerExpoPushTokenForCurrentUser } from "./pushRegistration";

/**
 * 根布局挂载：恢复本地每日提醒调度；登录态变化时上报 Expo Push Token。
 */
export function AppNotificationEffects() {
  useEffect(() => {
    void hydrateDailyReminderSchedule();
  }, []);

  useEffect(() => {
    void registerExpoPushTokenForCurrentUser();

    const { data } = onAuthStateChange((_event, session) => {
      if (session) void registerExpoPushTokenForCurrentUser();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return null;
}
