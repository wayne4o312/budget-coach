import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { SceneId } from '@/src/domain/scenes';

export type ReminderRule = {
  scene: SceneId;
  enabled: boolean;
  hour: number;
  minute: number;
  notificationId?: string;
};

export async function ensureNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('budget_reminders', {
    name: '记账提醒',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function requestReminderPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function sceneTitle(scene: SceneId): string {
  switch (scene) {
    case 'breakfast':
      return '早餐';
    case 'coffee':
      return '咖啡/奶茶';
    case 'commute':
      return '通勤';
    case 'lunch':
      return '午饭';
    case 'dinner':
      return '晚饭';
    case 'bedtime':
      return '睡前补记';
  }
}

export async function scheduleReminder(rule: Omit<ReminderRule, 'notificationId'>): Promise<string> {
  await ensureNotificationChannel();
  const trigger: Notifications.NotificationTriggerInput =
    Platform.OS === 'android'
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: rule.hour,
          minute: rule.minute,
          channelId: 'budget_reminders',
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: rule.hour,
          minute: rule.minute,
        };
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${sceneTitle(rule.scene)}记一笔`,
      body: '点我快速录入金额',
      data: { scene: rule.scene },
      sound: true,
    },
    trigger,
  });
  return id;
}

export async function cancelReminder(notificationId?: string) {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function upsertReminder(existing: ReminderRule | undefined, next: Omit<ReminderRule, 'notificationId'>) {
  if (!next.enabled) {
    await cancelReminder(existing?.notificationId);
    return { ...next, notificationId: undefined } satisfies ReminderRule;
  }

  // enabled: reschedule to keep it simple/reliable
  await cancelReminder(existing?.notificationId);
  const notificationId = await scheduleReminder(next);
  return { ...next, notificationId } satisfies ReminderRule;
}

