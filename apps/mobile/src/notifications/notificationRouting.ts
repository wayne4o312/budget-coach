import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

import type { SceneId } from '@/src/domain/scenes';

export function initNotificationRouting() {
  Notifications.addNotificationResponseReceivedListener((response) => {
    const scene = (response.notification.request.content.data?.scene as SceneId | undefined) ?? undefined;
    if (!scene) return;
    router.push({ pathname: '/add', params: { scene } });
  });
}

