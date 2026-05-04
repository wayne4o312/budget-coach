import { router, type Href } from "expo-router";
import * as Notifications from "expo-notifications";

import type { SceneId } from "@/src/domain/scenes";

export function initNotificationRouting() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content
      .data as Record<string, unknown> | undefined;
    if (!data || typeof data !== "object") return;

    const scene = data.scene as SceneId | undefined;
    if (scene) {
      router.push({ pathname: "/add", params: { scene } });
      return;
    }

    const kind = typeof data.kind === "string" ? data.kind : undefined;
    switch (kind) {
      case "budget_alert":
      case "spend_alert":
      case "ledger":
        router.push("/(tabs)/ledger" as Href);
        return;
      case "today":
      case "overview":
      case "test":
      default:
        if (kind)
          router.push("/(tabs)" as Href);
        break;
    }
  });
}
